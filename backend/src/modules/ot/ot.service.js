const pool = require('../../config/db');

class OtService {
  async getSurgeries() {
    const [surgeries] = await pool.query(`
      SELECT 
        s.ot_surgery_id,
        s.admission_id,
        s.lead_surgeon_id,
        s.procedure_name,
        s.scheduled_start,
        s.who_signin_completed,
        s.who_timeout_completed,
        s.who_signout_completed,
        s.operative_notes,
        s.surgery_status,
        s.created_at,
        p.patient_id,
        p.mrn,
        p.full_name AS patient_name,
        p.gender,
        p.age_years,
        b.bed_number,
        w.ward_name,
        surgeon.full_name AS surgeon_name
      FROM ot_surgeries s
      JOIN admissions ad ON s.admission_id = ad.admission_id
      JOIN patients p ON ad.patient_id = p.patient_id
      JOIN beds b ON ad.bed_id = b.bed_id
      JOIN wards w ON b.ward_id = w.ward_id
      JOIN users surgeon ON s.lead_surgeon_id = surgeon.user_id
      ORDER BY s.ot_surgery_id DESC
    `);

    // Attach counts summary for each surgery
    for (const surg of surgeries) {
      const [counts] = await pool.query(
        'SELECT * FROM ot_sponge_instrument_counts WHERE ot_surgery_id = ?',
        [surg.ot_surgery_id]
      );
      surg.counts = counts;
      surg.allCountsReconciled = counts.length > 0 && counts.every(c => c.is_reconciled === 1);
    }

    return surgeries;
  }

  async scheduleSurgery({ admissionId, leadSurgeonId, procedureName, scheduledStart }) {
    const formattedDate = scheduledStart 
      ? new Date(scheduledStart).toISOString().slice(0, 19).replace('T', ' ')
      : new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [res] = await pool.query(
      `INSERT INTO ot_surgeries (admission_id, lead_surgeon_id, procedure_name, scheduled_start, surgery_status)
       VALUES (?, ?, ?, ?, 'SCHEDULED')`,
      [admissionId, leadSurgeonId || 6, procedureName, formattedDate]
    );

    const [[surg]] = await pool.query(
      `SELECT s.*, p.full_name AS patient_name, surgeon.full_name AS surgeon_name
       FROM ot_surgeries s
       JOIN admissions ad ON s.admission_id = ad.admission_id
       JOIN patients p ON ad.patient_id = p.patient_id
       JOIN users surgeon ON s.lead_surgeon_id = surgeon.user_id
       WHERE s.ot_surgery_id = ?`,
      [res.insertId]
    );
    return surg;
  }

  async updateWhoChecklist(otSurgeryId, { whoSigninCompleted, whoTimeoutCompleted, whoSignoutCompleted, surgeryStatus }) {
    await pool.query(
      `UPDATE ot_surgeries 
       SET 
        who_signin_completed = COALESCE(?, who_signin_completed),
        who_timeout_completed = COALESCE(?, who_timeout_completed),
        who_signout_completed = COALESCE(?, who_signout_completed),
        surgery_status = COALESCE(?, surgery_status)
       WHERE ot_surgery_id = ?`,
      [
        whoSigninCompleted !== undefined ? (whoSigninCompleted ? 1 : 0) : null,
        whoTimeoutCompleted !== undefined ? (whoTimeoutCompleted ? 1 : 0) : null,
        whoSignoutCompleted !== undefined ? (whoSignoutCompleted ? 1 : 0) : null,
        surgeryStatus || null,
        otSurgeryId
      ]
    );

    const [[updated]] = await pool.query('SELECT * FROM ot_surgeries WHERE ot_surgery_id = ?', [otSurgeryId]);
    return updated;
  }

  async getCounts(otSurgeryId) {
    const [counts] = await pool.query(
      `SELECT c.*, u.full_name AS verified_by_nurse_name
       FROM ot_sponge_instrument_counts c
       JOIN users u ON c.verified_by_scrub_nurse_id = u.user_id
       WHERE c.ot_surgery_id = ?
       ORDER BY c.count_id ASC`,
      [otSurgeryId]
    );
    return counts;
  }

  async recordCount({ otSurgeryId, itemType, initialCount, postClosureCount, verifiedByScrubNurseId }) {
    const init = parseInt(initialCount, 10);
    const post = parseInt(postClosureCount, 10);
    const isReconciled = init === post ? 1 : 0;

    const [res] = await pool.query(
      `INSERT INTO ot_sponge_instrument_counts 
        (ot_surgery_id, item_type, initial_count, post_closure_count, is_reconciled, verified_by_scrub_nurse_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [otSurgeryId, itemType, init, post, isReconciled, verifiedByScrubNurseId]
    );

    const [[count]] = await pool.query(
      `SELECT c.*, u.full_name AS verified_by_nurse_name 
       FROM ot_sponge_instrument_counts c
       JOIN users u ON c.verified_by_scrub_nurse_id = u.user_id
       WHERE c.count_id = ?`,
      [res.insertId]
    );

    return {
      count,
      isReconciled: isReconciled === 1,
      alert: isReconciled === 0 ? `CRITICAL OT ALERT: ${itemType} count mismatch! Initial: ${init}, Post-Closure: ${post}` : 'Count verified & reconciled'
    };
  }

  async saveOperativeNotes(otSurgeryId, operativeNotes) {
    await pool.query(
      `UPDATE ot_surgeries 
       SET operative_notes = ?, surgery_status = 'COMPLETED'
       WHERE ot_surgery_id = ?`,
      [operativeNotes, otSurgeryId]
    );

    const [[updated]] = await pool.query('SELECT * FROM ot_surgeries WHERE ot_surgery_id = ?', [otSurgeryId]);
    return updated;
  }
}

module.exports = new OtService();

