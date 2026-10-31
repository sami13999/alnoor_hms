const pool = require('../../config/db');

class PharmacyService {
  async getInventory({ search = '', lasaOnly = false }) {
    let query = `
      SELECT 
        m.medicine_id,
        m.brand_name,
        m.generic_name,
        m.barcode,
        m.is_lasa,
        m.unit_type,
        m.reorder_level,
        mb.batch_id,
        mb.batch_number,
        mb.expiry_date,
        mb.purchase_price,
        mb.selling_price,
        mb.stock_quantity,
        mb.is_locked_fefo,
        DATEDIFF(mb.expiry_date, CURDATE()) AS days_until_expiry
      FROM medicines m
      LEFT JOIN medicine_batches mb ON m.medicine_id = mb.medicine_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (m.brand_name LIKE ? OR m.generic_name LIKE ? OR m.barcode LIKE ? OR mb.batch_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (lasaOnly) {
      query += ' AND m.is_lasa = 1';
    }

    // FEFO Ordering: First-Expiring, First-Out
    query += ' ORDER BY mb.expiry_date ASC, m.brand_name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getPendingPrescriptions() {
    const [prescriptions] = await pool.query(`
      SELECT 
        p.prescription_id,
        p.patient_id,
        p.doctor_id,
        p.diagnosis,
        p.created_at,
        pat.mrn,
        pat.full_name AS patient_name,
        pat.phone,
        doc.full_name AS doctor_name,
        COUNT(pi.item_id) AS total_items,
        SUM(CASE WHEN pi.dispense_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_items
      FROM prescriptions p
      JOIN patients pat ON p.patient_id = pat.patient_id
      JOIN users doc ON p.doctor_id = doc.user_id
      JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
      GROUP BY p.prescription_id
      HAVING pending_items > 0
      ORDER BY p.prescription_id DESC
    `);

    for (const rx of prescriptions) {
      const [items] = await pool.query(
        'SELECT * FROM prescription_items WHERE prescription_id = ? AND dispense_status = "PENDING"',
        [rx.prescription_id]
      );
      rx.items = items;
    }

    return prescriptions;
  }

  async dispenseAtomic({ patientId, prescriptionId, cashierId, items }) {
    if (!items || items.length === 0) {
      throw new Error('No items specified for dispensing');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let totalAmount = 0;
      const verifiedItems = [];

      // Validate batches and calculate total
      for (const item of items) {
        const [[batch]] = await connection.query(
          `SELECT mb.*, m.brand_name, m.generic_name, m.is_lasa 
           FROM medicine_batches mb
           JOIN medicines m ON mb.medicine_id = m.medicine_id
           WHERE mb.batch_id = ? FOR UPDATE`,
          [item.batchId]
        );

        if (!batch) {
          throw new Error(`Batch ID ${item.batchId} not found`);
        }

        if (batch.is_locked_fefo) {
          throw new Error(`Batch ${batch.batch_number} is locked by FEFO quality control protocol`);
        }

        if (batch.stock_quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${batch.brand_name} (Batch: ${batch.batch_number}). Available: ${batch.stock_quantity}, Requested: ${item.quantity}`
          );
        }

        const unitPrice = item.unitPrice !== undefined ? item.unitPrice : batch.selling_price;
        const subtotal = Number((unitPrice * item.quantity).toFixed(2));
        totalAmount += subtotal;

        verifiedItems.push({
          batchId: batch.batch_id,
          brandName: batch.brand_name,
          genericName: batch.generic_name,
          batchNumber: batch.batch_number,
          quantity: item.quantity,
          unitPrice,
          subtotal
        });
      }

      // Insert pharmacy sale
      const [saleRes] = await connection.query(
        `INSERT INTO pharmacy_sales (patient_id, prescription_id, cashier_id, total_amount, payment_status)
         VALUES (?, ?, ?, ?, 'PAID')`,
        [patientId || null, prescriptionId || null, cashierId, totalAmount]
      );
      const saleId = saleRes.insertId;

      // Insert sale items and deduct inventory
      for (const vItem of verifiedItems) {
        await connection.query(
          `INSERT INTO pharmacy_sale_items (sale_id, batch_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, vItem.batchId, vItem.quantity, vItem.unitPrice, vItem.subtotal]
        );

        await connection.query(
          'UPDATE medicine_batches SET stock_quantity = stock_quantity - ? WHERE batch_id = ?',
          [vItem.quantity, vItem.batchId]
        );
      }

      // If prescription linked, update prescription items dispense_status
      if (prescriptionId) {
        await connection.query(
          'UPDATE prescription_items SET dispense_status = "DISPENSED" WHERE prescription_id = ?',
          [prescriptionId]
        );
      }

      await connection.commit();

      return {
        saleId,
        totalAmount,
        paymentStatus: 'PAID',
        items: verifiedItems,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getCrashCartLogs() {
    const [logs] = await pool.query(`
      SELECT 
        c.*, 
        u.full_name AS verified_by_nurse_name 
      FROM crash_cart_logs c
      JOIN users u ON c.verified_by_nurse_id = u.user_id
      ORDER BY c.cart_log_id DESC
      LIMIT 30
    `);
    return logs;
  }

  async verifyCrashCart({ wardName, sealNumber, verifiedByNurseId, adrenalineQty, atropineQty, notes }) {
    const [result] = await pool.query(
      `INSERT INTO crash_cart_logs 
        (ward_name, seal_number, verified_by_nurse_id, adrenaline_qty, atropine_qty, verification_date, notes)
       VALUES (?, ?, ?, ?, ?, CURDATE(), ?)`,
      [wardName, sealNumber, verifiedByNurseId, adrenalineQty || 0, atropineQty || 0, notes || null]
    );

    const [[log]] = await pool.query(
      `SELECT c.*, u.full_name AS verified_by_nurse_name
       FROM crash_cart_logs c
       JOIN users u ON c.verified_by_nurse_id = u.user_id
       WHERE c.cart_log_id = ?`,
      [result.insertId]
    );
    return log;
  }
}

module.exports = new PharmacyService();

