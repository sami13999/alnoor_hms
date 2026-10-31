const pool = require('../../config/db');

class BillingService {
  async getInvoices({ status = '', search = '' }) {
    let query = `
      SELECT 
        i.invoice_id,
        i.invoice_number,
        i.patient_id,
        i.admission_id,
        i.total_amount,
        i.discount_amount,
        i.net_amount,
        i.paid_amount,
        i.payment_status,
        i.created_at,
        p.mrn,
        p.full_name AS patient_name,
        p.phone,
        u.full_name AS cashier_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.patient_id
      JOIN users u ON i.cashier_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      query += ' AND i.payment_status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (i.invoice_number LIKE ? OR p.full_name LIKE ? OR p.mrn LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    query += ' ORDER BY i.invoice_id DESC LIMIT 50';

    const [invoices] = await pool.query(query, params);
    return invoices;
  }

  async getInvoiceDetails(invoiceId) {
    const [[invoice]] = await pool.query(
      `SELECT i.*, p.mrn, p.full_name AS patient_name, p.phone, u.full_name AS cashier_name
       FROM invoices i
       JOIN patients p ON i.patient_id = p.patient_id
       JOIN users u ON i.cashier_id = u.user_id
       WHERE i.invoice_id = ?`,
      [invoiceId]
    );
    if (!invoice) return null;

    const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
    invoice.items = items;
    return invoice;
  }

  async consolidateInvoice({ patientId, admissionId, cashierId, discountAmount = 0 }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const items = [];
      let total = 0;

      // 1. Bed Stay Charges if admission provided
      if (admissionId) {
        const [[admit]] = await connection.query(
          `SELECT ad.*, DATEDIFF(COALESCE(ad.discharged_at, NOW()), ad.admitted_at) AS days, w.ward_name, b.bed_number
           FROM admissions ad
           JOIN beds b ON ad.bed_id = b.bed_id
           JOIN wards w ON b.ward_id = w.ward_id
           WHERE ad.admission_id = ?`,
          [admissionId]
        );

        if (admit) {
          const days = Math.max(1, admit.days || 1);
          const bedRate = 1500.00;
          const bedTotal = days * bedRate;
          total += bedTotal;
          items.push({
            serviceType: 'BED_CHARGE',
            refId: admissionId,
            desc: `Inpatient Bed Stay (${admit.ward_name} - ${admit.bed_number}) x ${days} day(s)`,
            amount: bedTotal
          });
        }

        // 2. OT Surgery fees if applicable
        const [surgeries] = await connection.query(
          'SELECT * FROM ot_surgeries WHERE admission_id = ?',
          [admissionId]
        );
        for (const surg of surgeries) {
          const otFee = 25000.00;
          total += otFee;
          items.push({
            serviceType: 'OT_SURGERY',
            refId: surg.ot_surgery_id,
            desc: `OT Procedure: ${surg.procedure_name} (Surgical Theatre & Consumables)`,
            amount: otFee
          });
        }
      }

      // 3. Unbilled Lab Orders
      const [labs] = await connection.query(
        `SELECT lo.lab_order_id, lt.test_name, lt.standard_fee 
         FROM lab_orders lo
         JOIN lab_tests lt ON lo.test_id = lt.test_id
         WHERE lo.patient_id = ?
         LIMIT 5`,
        [patientId]
      );
      for (const lab of labs) {
        const fee = parseFloat(lab.standard_fee);
        total += fee;
        items.push({
          serviceType: 'LAB_TEST',
          refId: lab.lab_order_id,
          desc: `Diagnostic Lab: ${lab.test_name}`,
          amount: fee
        });
      }

      // 4. Pharmacy sales
      const [pharm] = await connection.query(
        'SELECT sale_id, total_amount FROM pharmacy_sales WHERE patient_id = ? LIMIT 5',
        [patientId]
      );
      for (const ph of pharm) {
        const pTotal = parseFloat(ph.total_amount);
        total += pTotal;
        items.push({
          serviceType: 'PHARMACY',
          refId: ph.sale_id,
          desc: `Pharmacy POS Prescription Dispense (Sale #${ph.sale_id})`,
          amount: pTotal
        });
      }

      // If no items generated, add standard clinical evaluation
      if (items.length === 0) {
        const fee = 1000.00;
        total += fee;
        items.push({
          serviceType: 'OPD_TOKEN',
          refId: null,
          desc: 'Comprehensive Medical Consultation & Hospital Services',
          amount: fee
        });
      }

      const discount = parseFloat(discountAmount) || 0.00;
      const net = Math.max(0, total - discount);

      // Generate invoice number
      const [[cntRow]] = await connection.query('SELECT COUNT(*) AS c FROM invoices');
      const invoiceNumber = `INV-CON-${new Date().getFullYear()}-${String(cntRow.c + 1).padStart(6, '0')}`;

      const [invRes] = await connection.query(
        `INSERT INTO invoices 
          (invoice_number, patient_id, admission_id, total_amount, discount_amount, net_amount, paid_amount, payment_status, cashier_id)
         VALUES (?, ?, ?, ?, ?, ?, 0.00, 'UNPAID', ?)`,
        [invoiceNumber, patientId, admissionId || null, total, discount, net, cashierId]
      );
      const invoiceId = invRes.insertId;

      for (const it of items) {
        await connection.query(
          `INSERT INTO invoice_items (invoice_id, service_type, reference_id, description, amount)
           VALUES (?, ?, ?, ?, ?)`,
          [invoiceId, it.serviceType, it.refId, it.desc, it.amount]
        );
      }

      await connection.commit();
      return this.getInvoiceDetails(invoiceId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async settleInvoice(invoiceId, paidAmount, cashierId) {
    const [[inv]] = await pool.query('SELECT * FROM invoices WHERE invoice_id = ?', [invoiceId]);
    if (!inv) throw new Error('Invoice not found');

    const amount = parseFloat(paidAmount);
    const newPaid = parseFloat(inv.paid_amount) + amount;
    const net = parseFloat(inv.net_amount);
    const status = newPaid >= net ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'UNPAID');

    await pool.query(
      `UPDATE invoices 
       SET paid_amount = ?, payment_status = ?, cashier_id = ?
       WHERE invoice_id = ?`,
      [newPaid, status, cashierId || inv.cashier_id, invoiceId]
    );

    return this.getInvoiceDetails(invoiceId);
  }

  async getCurrentShiftDrawer(cashierId) {
    const [drawers] = await pool.query(
      `SELECT * FROM shift_cash_drawers 
       WHERE shift_status = 'OPEN' AND cashier_id = ?
       ORDER BY shift_id DESC LIMIT 1`,
      [cashierId]
    );

    if (drawers.length === 0) return null;
    const drawer = drawers[0];

    // Compute live billed cash during this shift
    const [[billed]] = await pool.query(
      `SELECT COALESCE(SUM(paid_amount), 0) AS live_billed_cash
       FROM invoices
       WHERE cashier_id = ? AND created_at >= ?`,
      [cashierId, drawer.opening_time]
    );

    drawer.live_billed_cash = parseFloat(billed.live_billed_cash);
    drawer.expected_cash_in_drawer = parseFloat(drawer.opening_balance) + drawer.live_billed_cash;
    return drawer;
  }

  async openShiftDrawer({ cashierId, department, openingBalance }) {
    // Check if one is already open
    const [active] = await pool.query(
      'SELECT shift_id FROM shift_cash_drawers WHERE cashier_id = ? AND shift_status = "OPEN"',
      [cashierId]
    );
    if (active.length > 0) {
      throw new Error('An active shift cash drawer is already open for this cashier.');
    }

    const [res] = await pool.query(
      `INSERT INTO shift_cash_drawers 
        (cashier_id, department, opening_time, opening_balance, shift_status)
       VALUES (?, ?, NOW(), ?, 'OPEN')`,
      [cashierId, department || 'CENTRAL_CASH', openingBalance || 5000.00]
    );

    return this.getCurrentShiftDrawer(cashierId);
  }

  async closeShiftDrawer({ shiftId, physicalCountedCash, notes }) {
    const [[drawer]] = await pool.query(
      'SELECT * FROM shift_cash_drawers WHERE shift_id = ? AND shift_status = "OPEN"',
      [shiftId]
    );
    if (!drawer) throw new Error('Active shift drawer not found or already closed.');

    // Calculate billed cash during shift
    const [[billed]] = await pool.query(
      `SELECT COALESCE(SUM(paid_amount), 0) AS total_billed
       FROM invoices
       WHERE cashier_id = ? AND created_at >= ?`,
      [drawer.cashier_id, drawer.opening_time]
    );

    const systemBilledCash = parseFloat(billed.total_billed);
    const openingBal = parseFloat(drawer.opening_balance);
    const counted = parseFloat(physicalCountedCash);
    const expected = openingBal + systemBilledCash;
    const discrepancy = counted - expected;

    await pool.query(
      `UPDATE shift_cash_drawers 
       SET 
        closing_time = NOW(),
        system_billed_cash = ?,
        physical_counted_cash = ?,
        shift_status = 'CLOSED',
        reconciliation_notes = ?
       WHERE shift_id = ?`,
      [systemBilledCash, counted, notes || null, shiftId]
    );

    const [[closed]] = await pool.query('SELECT * FROM shift_cash_drawers WHERE shift_id = ?', [shiftId]);
    return {
      drawer: closed,
      balanced: discrepancy === 0,
      discrepancy,
      alert: discrepancy !== 0 ? `Cash discrepancy of Rs. ${discrepancy.toFixed(2)} recorded on closing.` : 'Drawer perfectly balanced.'
    };
  }

  async getRecentShiftDrawers() {
    const [drawers] = await pool.query(`
      SELECT s.*, u.full_name AS cashier_name
      FROM shift_cash_drawers s
      JOIN users u ON s.cashier_id = u.user_id
      ORDER BY s.shift_id DESC
      LIMIT 20
    `);
    return drawers;
  }
}

module.exports = new BillingService();

