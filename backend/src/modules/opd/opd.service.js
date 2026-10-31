const pool = require('../../config/db');

class OpdService {
  async searchPatients(searchTerm = '') {
    const term = `%${searchTerm}%`;
    const [patients] = await pool.query(
      `SELECT patient_id, mrn, full_name, gender, dob, age_years, cnic, phone, emergency_contact, address, is_emergency_bypass, created_at
       FROM patients
       WHERE mrn LIKE ? OR phone LIKE ? OR cnic LIKE ? OR full_name LIKE ?
       ORDER BY patient_id DESC
       LIMIT 50`,
      [term, term, term, term]
    );
    return patients;
  }

  async getPatientById(patientId) {
    const [patients] = await pool.query('SELECT * FROM patients WHERE patient_id = ?', [patientId]);
    return patients[0] || null;
  }

  async registerPatient(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate MRN: AN-YYYY-NNNNN
      const currentYear = new Date().getFullYear();
      const [[countRow]] = await connection.query('SELECT COUNT(*) AS total FROM patients');
      const sequence = String(countRow.total + 1).padStart(5, '0');
      const mrn = `AN-${currentYear}-${sequence}`;

      const [result] = await connection.query(
        `INSERT INTO patients 
          (mrn, full_name, gender, dob, age_years, cnic, phone, emergency_contact, address, is_emergency_bypass)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mrn,
          data.fullName || data.full_name,
          data.gender || 'OTHER',
          data.dob || null,
          data.ageYears || data.age_years || null,
          data.cnic || null,
          data.phone,
          data.emergencyContact || data.emergency_contact || null,
          data.address || null,
          data.isEmergencyBypass ? 1 : 0
        ]
      );

      const patientId = result.insertId;
      await connection.commit();

      const [newPatient] = await pool.query('SELECT * FROM patients WHERE patient_id = ?', [patientId]);
      return newPatient[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async generateToken({ patientId, doctorId, cashierId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Today's token counter
      const [[tokenCountRow]] = await connection.query(
        'SELECT COUNT(*) AS today_count FROM appointments WHERE appointment_date = CURDATE()'
      );
      const tokenNumber = `TK-${String(tokenCountRow.today_count + 1).padStart(3, '0')}`;

      // Insert appointment
      const [apptResult] = await connection.query(
        `INSERT INTO appointments (token_number, patient_id, doctor_id, appointment_date, queue_status)
         VALUES (?, ?, ?, CURDATE(), 'WAITING')`,
        [tokenNumber, patientId, doctorId]
      );
      const appointmentId = apptResult.insertId;

      // Create OPD Consultation Invoice
      const [[invCount]] = await connection.query('SELECT COUNT(*) AS count FROM invoices');
      const invoiceNumber = `INV-OPD-${new Date().getFullYear()}-${String(invCount.count + 1).padStart(6, '0')}`;
      const consultationFee = 500.00;

      const [invResult] = await connection.query(
        `INSERT INTO invoices 
          (invoice_number, patient_id, total_amount, discount_amount, net_amount, paid_amount, payment_status, cashier_id)
         VALUES (?, ?, ?, 0.00, ?, ?, 'PAID', ?)`,
        [invoiceNumber, patientId, consultationFee, consultationFee, consultationFee, cashierId || 1]
      );
      const invoiceId = invResult.insertId;

      await connection.query(
        `INSERT INTO invoice_items (invoice_id, service_type, reference_id, description, amount)
         VALUES (?, 'OPD_TOKEN', ?, 'Specialist Doctor OPD Consultation Fee', ?)`,
        [invoiceId, appointmentId, consultationFee]
      );

      await connection.commit();

      // Fetch enriched details for the 80mm printable thermal slip
      const [[slipData]] = await pool.query(
        `SELECT 
          a.appointment_id,
          a.token_number,
          a.appointment_date,
          a.created_at,
          p.patient_id,
          p.mrn,
          p.full_name AS patient_name,
          p.gender,
          p.age_years,
          p.phone,
          u.full_name AS doctor_name,
          i.invoice_number,
          i.net_amount
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         JOIN users u ON a.doctor_id = u.user_id
         LEFT JOIN invoices i ON i.invoice_id = ?
         WHERE a.appointment_id = ?`,
        [invoiceId, appointmentId]
      );

      return slipData;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async triggerRedAlertEmergency({ fullName, gender, ageYears, phone, doctorId, nurseId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Create emergency patient record
      const timestamp = Date.now().toString().slice(-6);
      const mrn = `ER-${new Date().getFullYear()}-${timestamp}`;
      const name = fullName || `Emergency Resus Patient #${timestamp}`;

      const [patientResult] = await connection.query(
        `INSERT INTO patients (mrn, full_name, gender, age_years, phone, is_emergency_bypass)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [mrn, name, gender || 'OTHER', ageYears || 35, phone || '0300-0000000']
      );
      const patientId = patientResult.insertId;

      // 2. Select Vacant ER Bed
      const [erBeds] = await connection.query(
        `SELECT b.bed_id, b.bed_number, w.ward_name
         FROM beds b
         JOIN wards w ON b.ward_id = w.ward_id
         WHERE w.ward_type = 'EMERGENCY' AND b.status = 'VACANT'
         LIMIT 1`
      );

      let allocatedBed = erBeds[0];
      if (!allocatedBed) {
        // Fallback: pick any available bed or force assign bed 1
        const [anyBeds] = await connection.query(
          `SELECT b.bed_id, b.bed_number, w.ward_name
           FROM beds b
           JOIN wards w ON b.ward_id = w.ward_id
           LIMIT 1`
        );
        allocatedBed = anyBeds[0];
      }

      // 3. Mark bed as OCCUPIED
      await connection.query('UPDATE beds SET status = "OCCUPIED" WHERE bed_id = ?', [allocatedBed.bed_id]);

      // 4. Create Admission record with wristband barcode (WB-ER-NNNNNN)
      const wristbandBarcode = `WB-ER-${Math.floor(100000 + Math.random() * 900000)}`;
      const attendingDocId = doctorId || 2; // Default to Dr. Tariq Shah (Surgeon/ER Lead)

      const [admitResult] = await connection.query(
        `INSERT INTO admissions 
          (patient_id, bed_id, wristband_barcode, attending_doctor_id, admission_status)
         VALUES (?, ?, ?, ?, 'ACTIVE')`,
        [patientId, allocatedBed.bed_id, wristbandBarcode, attendingDocId]
      );

      await connection.commit();

      const [[admissionDetails]] = await pool.query(
        `SELECT 
          ad.admission_id,
          ad.wristband_barcode,
          ad.admitted_at,
          ad.admission_status,
          p.patient_id,
          p.mrn,
          p.full_name,
          p.gender,
          p.age_years,
          p.is_emergency_bypass,
          b.bed_id,
          b.bed_number,
          w.ward_name,
          u.full_name AS doctor_name
         FROM admissions ad
         JOIN patients p ON ad.patient_id = p.patient_id
         JOIN beds b ON ad.bed_id = b.bed_id
         JOIN wards w ON b.ward_id = w.ward_id
         JOIN users u ON ad.attending_doctor_id = u.user_id
         WHERE ad.admission_id = ?`,
        [admitResult.insertId]
      );

      return admissionDetails;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getRecentAppointments() {
    const [appointments] = await pool.query(
      `SELECT 
        a.appointment_id,
        a.token_number,
        a.appointment_date,
        a.queue_status,
        a.created_at,
        p.patient_id,
        p.mrn,
        p.full_name AS patient_name,
        p.phone,
        u.full_name AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN users u ON a.doctor_id = u.user_id
       WHERE a.appointment_date = CURDATE()
       ORDER BY a.appointment_id DESC
       LIMIT 50`
    );
    return appointments;
  }
}

module.exports = new OpdService();

