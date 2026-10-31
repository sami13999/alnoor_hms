const pool = require('../../config/db');

class IpdService {
  async getWardsAndBeds() {
    const [wards] = await pool.query('SELECT * FROM wards ORDER BY ward_id ASC');
    const [beds] = await pool.query(`
      SELECT 
        b.bed_id,
        b.ward_id,
        b.bed_number,
        b.status,
        ad.admission_id,
        ad.wristband_barcode,
        ad.admitted_at,
        p.patient_id,
        p.mrn,
        p.full_name AS patient_name,
        p.gender,
        p.age_years,
        doc.full_name AS doctor_name
      FROM beds b
      LEFT JOIN admissions ad ON b.bed_id = ad.bed_id AND ad.admission_status = 'ACTIVE'
      LEFT JOIN patients p ON ad.patient_id = p.patient_id
      LEFT JOIN users doc ON ad.attending_doctor_id = doc.user_id
      ORDER BY b.bed_number ASC
    `);

    // Group beds under their respective wards
    return wards.map((ward) => {
      return {
        ...ward,
        beds: beds.filter((bed) => bed.ward_id === ward.ward_id)
      };
    });
  }

  async updateBedStatus(bedId, status) {
    await pool.query('UPDATE beds SET status = ? WHERE bed_id = ?', [status, bedId]);
    return { bedId, status };
  }

  async admitPatient({ patientId, bedId, attendingDoctorId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check bed availability
      const [[bed]] = await connection.query('SELECT * FROM beds WHERE bed_id = ? FOR UPDATE', [bedId]);
      if (!bed) throw new Error('Bed not found');
      if (bed.status !== 'VACANT') {
        throw new Error(`Bed ${bed.bed_number} is currently ${bed.status}`);
      }

      // Generate 250x30mm wristband barcode
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      const wristbandBarcode = `WB-${dateStr}-${rand}`;

      const [res] = await connection.query(
        `INSERT INTO admissions 
          (patient_id, bed_id, wristband_barcode, attending_doctor_id, admission_status)
         VALUES (?, ?, ?, ?, 'ACTIVE')`,
        [patientId, bedId, wristbandBarcode, attendingDoctorId || 2]
      );
      const admissionId = res.insertId;

      // Mark bed as OCCUPIED
      await connection.query('UPDATE beds SET status = "OCCUPIED" WHERE bed_id = ?', [bedId]);

      await connection.commit();
      return this.getWristbandPrintData(admissionId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getActiveAdmissions() {
    const [admissions] = await pool.query(`
      SELECT 
        ad.admission_id,
        ad.wristband_barcode,
        ad.admitted_at,
        ad.admission_status,
        ad.discharge_summary_signed,
        p.patient_id,
        p.mrn,
        p.full_name AS patient_name,
        p.gender,
        p.age_years,
        p.phone,
        b.bed_id,
        b.bed_number,
        w.ward_id,
        w.ward_name,
        doc.full_name AS doctor_name
      FROM admissions ad
      JOIN patients p ON ad.patient_id = p.patient_id
      JOIN beds b ON ad.bed_id = b.bed_id
      JOIN wards w ON b.ward_id = w.ward_id
      JOIN users doc ON ad.attending_doctor_id = doc.user_id
      WHERE ad.admission_status = 'ACTIVE'
      ORDER BY ad.admission_id DESC
    `);
    return admissions;
  }

  async dischargePatient(admissionId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [[admission]] = await connection.query(
        'SELECT bed_id FROM admissions WHERE admission_id = ? AND admission_status = "ACTIVE" FOR UPDATE',
        [admissionId]
      );

      if (!admission) throw new Error('Active admission not found');

      // Update admission status
      await connection.query(
        `UPDATE admissions 
         SET admission_status = 'DISCHARGED', discharged_at = NOW(), discharge_summary_signed = 1
         WHERE admission_id = ?`,
        [admissionId]
      );

      // Terminal housekeeping: mark bed as DIRTY
      await connection.query('UPDATE beds SET status = "DIRTY" WHERE bed_id = ?', [admission.bed_id]);

      await connection.commit();
      return { admissionId, status: 'DISCHARGED', bedStatus: 'DIRTY' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getWristbandPrintData(admissionId) {
    const [[data]] = await pool.query(
      `SELECT 
        ad.admission_id,
        ad.wristband_barcode,
        ad.admitted_at,
        p.patient_id,
        p.mrn,
        p.full_name AS patient_name,
        p.gender,
        p.dob,
        p.age_years,
        p.emergency_contact,
        b.bed_number,
        w.ward_name,
        doc.full_name AS doctor_name
       FROM admissions ad
       JOIN patients p ON ad.patient_id = p.patient_id
       JOIN beds b ON ad.bed_id = b.bed_id
       JOIN wards w ON b.ward_id = w.ward_id
       JOIN users doc ON ad.attending_doctor_id = doc.user_id
       WHERE ad.admission_id = ?`,
      [admissionId]
    );
    return data;
  }
}

module.exports = new IpdService();

