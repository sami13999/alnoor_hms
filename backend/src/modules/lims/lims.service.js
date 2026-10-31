const pool = require('../../config/db');

class LimsService {
  async getLabTests() {
    const [tests] = await pool.query('SELECT * FROM lab_tests ORDER BY test_id ASC');
    return tests;
  }

  async getLabOrders(status = null) {
    let query = `
      SELECT 
        lo.lab_order_id,
        lo.specimen_barcode,
        lo.order_status,
        lo.verified_at,
        lo.created_at,
        p.patient_id,
        p.mrn,
        p.full_name AS patient_name,
        p.gender,
        p.age_years,
        lt.test_id,
        lt.test_code,
        lt.test_name,
        lt.sample_type,
        lt.standard_fee,
        d.full_name AS doctor_name,
        patho.full_name AS pathologist_name
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.patient_id
      JOIN lab_tests lt ON lo.test_id = lt.test_id
      JOIN users d ON lo.doctor_id = d.user_id
      LEFT JOIN users patho ON lo.pathologist_id = patho.user_id
    `;
    const params = [];
    if (status) {
      query += ' WHERE lo.order_status = ?';
      params.push(status);
    }
    query += ' ORDER BY lo.lab_order_id DESC LIMIT 50';

    const [orders] = await pool.query(query, params);
    return orders;
  }

  async getOrderDetails(labOrderId) {
    const [[order]] = await pool.query(
      `SELECT 
        lo.*,
        p.mrn,
        p.full_name AS patient_name,
        p.gender,
        p.age_years,
        p.phone,
        lt.test_code,
        lt.test_name,
        lt.sample_type,
        lt.standard_fee,
        d.full_name AS doctor_name,
        patho.full_name AS pathologist_name
       FROM lab_orders lo
       JOIN patients p ON lo.patient_id = p.patient_id
       JOIN lab_tests lt ON lo.test_id = lt.test_id
       JOIN users d ON lo.doctor_id = d.user_id
       LEFT JOIN users patho ON lo.pathologist_id = patho.user_id
       WHERE lo.lab_order_id = ?`,
      [labOrderId]
    );

    if (!order) return null;

    // Check if CBC results exist
    const [[cbc]] = await pool.query(
      'SELECT * FROM lab_cbc_results WHERE lab_order_id = ?',
      [labOrderId]
    );
    order.cbcResults = cbc || null;

    return order;
  }

  async createLabOrder({ patientId, testId, doctorId }) {
    // Generate SPEC-YYYYMMDD-NNNNN
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = String(Math.floor(10000 + Math.random() * 90000));
    const specimenBarcode = `SPEC-${dateStr}-${randSeq}`;

    const [result] = await pool.query(
      `INSERT INTO lab_orders (specimen_barcode, patient_id, test_id, doctor_id, order_status)
       VALUES (?, ?, ?, ?, 'SAMPLE_COLLECTED')`,
      [specimenBarcode, patientId, testId, doctorId]
    );

    return this.getOrderDetails(result.insertId);
  }

  async simulateAnalyzerCapture(labOrderId) {
    const order = await this.getOrderDetails(labOrderId);
    if (!order) throw new Error('Lab order not found');

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Swelab Alfa 16-parameter hematology profile simulation
      const wbc = +(6.5 + Math.random() * 3.5).toFixed(2);
      const rbc = +(4.2 + Math.random() * 1.2).toFixed(2);
      const hgb = +(12.5 + Math.random() * 3.0).toFixed(2);
      const plt = +(180 + Math.random() * 150).toFixed(1);
      const mcv = +(82.0 + Math.random() * 12.0).toFixed(2);
      const mch = +(27.0 + Math.random() * 5.0).toFixed(2);
      const mchc = +(32.0 + Math.random() * 3.0).toFixed(2);
      const hct = +(38.0 + Math.random() * 8.0).toFixed(2);
      const rdw_pct = +(12.0 + Math.random() * 3.0).toFixed(2);
      const lym_num = +(1.5 + Math.random() * 1.5).toFixed(2);
      const lym_pct = +(25.0 + Math.random() * 15.0).toFixed(2);
      const mid_num = +(0.3 + Math.random() * 0.5).toFixed(2);
      const mid_pct = +(4.0 + Math.random() * 5.0).toFixed(2);
      const gra_num = +(3.5 + Math.random() * 3.0).toFixed(2);
      const gra_pct = +(55.0 + Math.random() * 15.0).toFixed(2);
      const mpv = +(8.0 + Math.random() * 2.5).toFixed(2);

      const rawSerialPayload = `MSH|^~\\&|SWELAB_ALFA_16|ALNOOR_HOSPITAL|LIS|BMS|${new Date().toISOString()}|ORU^R01|MSG${Date.now()}|P|2.3.1\rPID|1||${order.mrn}||${order.patient_name}\rOBX|1|NM|WBC^White Blood Cell||${wbc}|10^9/L|4.0-10.0|N\rOBX|2|NM|RBC^Red Blood Cell||${rbc}|10^12/L|3.8-5.8|N\rOBX|3|NM|HGB^Hemoglobin||${hgb}|g/dL|11.5-16.5|N\rOBX|4|NM|PLT^Platelets||${plt}|10^9/L|150-450|N`;

      // Upsert lab_cbc_results
      await connection.query(
        `INSERT INTO lab_cbc_results 
          (lab_order_id, wbc, rbc, hgb, plt, mcv, mch, mchc, hct, rdw_pct, lym_num, lym_pct, mid_num, mid_pct, gra_num, gra_pct, mpv, raw_serial_payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          wbc=VALUES(wbc), rbc=VALUES(rbc), hgb=VALUES(hgb), plt=VALUES(plt), mcv=VALUES(mcv),
          mch=VALUES(mch), mchc=VALUES(mchc), hct=VALUES(hct), rdw_pct=VALUES(rdw_pct),
          lym_num=VALUES(lym_num), lym_pct=VALUES(lym_pct), mid_num=VALUES(mid_num),
          mid_pct=VALUES(mid_pct), gra_num=VALUES(gra_num), gra_pct=VALUES(gra_pct),
          mpv=VALUES(mpv), raw_serial_payload=VALUES(raw_serial_payload)`,
        [
          labOrderId, wbc, rbc, hgb, plt, mcv, mch, mchc, hct, rdw_pct,
          lym_num, lym_pct, mid_num, mid_pct, gra_num, gra_pct, mpv, rawSerialPayload
        ]
      );

      // Update lab order status
      await connection.query(
        'UPDATE lab_orders SET order_status = "RESULT_READY" WHERE lab_order_id = ?',
        [labOrderId]
      );

      await connection.commit();
      return this.getOrderDetails(labOrderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async verifyOrder(labOrderId, pathologistId) {
    const verifiedPathologistId = pathologistId || 4; // default Lab Tech/Pathologist

    await pool.query(
      `UPDATE lab_orders 
       SET order_status = 'VERIFIED', pathologist_id = ?, verified_at = NOW()
       WHERE lab_order_id = ?`,
      [verifiedPathologistId, labOrderId]
    );

    const verifiedOrder = await this.getOrderDetails(labOrderId);

    // Attach verification QR hash
    verifiedOrder.qrVerificationMark = `AN-LIMS-VERIFIED:${verifiedOrder.specimen_barcode}:${verifiedOrder.verified_at}`;
    return verifiedOrder;
  }
}

module.exports = new LimsService();

