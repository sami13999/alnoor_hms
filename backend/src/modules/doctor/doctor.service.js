const pool = require('../../config/db');

class DoctorService {
  async getLiveQueue(doctorId) {
    let query = `
      SELECT 
        a.appointment_id,
        a.token_number,
        a.appointment_date,
        a.queue_status,
        a.created_at,
        p.patient_id,
        p.mrn,
        p.full_name AS patient_name,
        p.gender,
        p.age_years,
        p.phone,
        u.full_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN users u ON a.doctor_id = u.user_id
      WHERE a.appointment_date = CURDATE()
    `;
    const params = [];
    if (doctorId) {
      query += ' AND a.doctor_id = ?';
      params.push(doctorId);
    }
    query += ' ORDER BY FIELD(a.queue_status, "IN_CONSULTATION", "WAITING", "COMPLETED", "CANCELLED"), a.appointment_id ASC';

    const [queue] = await pool.query(query, params);
    return queue;
  }

  async updateAppointmentStatus(appointmentId, status) {
    await pool.query('UPDATE appointments SET queue_status = ? WHERE appointment_id = ?', [status, appointmentId]);
    return { appointmentId, status };
  }

  async getClinicalOrderSets() {
    const [orderSets] = await pool.query('SELECT * FROM clinical_order_sets ORDER BY order_set_id ASC');
    return orderSets;
  }

  async createPrescription({ patientId, doctorId, appointmentId, diagnosis, items = [], orderSetKitCode, labTestIds = [] }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert Prescription header
      const [rxResult] = await connection.query(
        `INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, diagnosis, is_locked)
         VALUES (?, ?, ?, ?, 1)`,
        [patientId, doctorId, appointmentId || null, diagnosis || 'Clinical Evaluation & Treatment']
      );
      const prescriptionId = rxResult.insertId;

      // 2. If kitCode is selected, add preset items
      let mergedItems = [...items];
      if (orderSetKitCode === 'APPENDECTOMY_KIT') {
        mergedItems.push(
          { drugName: 'Rocephin 1g Inj', dosage: '1g IV', frequency: 'BD (Twice Daily)', durationDays: 3, instructions: 'Pre-op Antibiotic Prophylaxis' },
          { drugName: 'Toradol 30mg Inj', dosage: '30mg IV', frequency: 'PRN (As Needed)', durationDays: 2, instructions: 'Pain management' },
          { drugName: 'Normal Saline 1000ml', dosage: '1000ml IV', frequency: 'Stat', durationDays: 1, instructions: 'IV Hydration' }
        );
      } else if (orderSetKitCode === 'ER_RESUS_KIT') {
        mergedItems.push(
          { drugName: 'Adrenaline 1mg Inj', dosage: '1mg IV/IM', frequency: 'Stat', durationDays: 1, instructions: 'Resuscitation Protocol' },
          { drugName: 'Atropine 1mg Inj', dosage: '1mg IV', frequency: 'Stat', durationDays: 1, instructions: 'Bradycardia / Resus' },
          { drugName: 'Normal Saline 1000ml', dosage: '1000ml IV', frequency: 'Stat', durationDays: 1, instructions: 'Rapid Infusion' }
        );
      } else if (orderSetKitCode === 'POSTOP_PAIN_KIT') {
        mergedItems.push(
          { drugName: 'Tramal 100mg Inj', dosage: '100mg IV Slow', frequency: 'TDS (Three Times)', durationDays: 2, instructions: 'Post-op analgesia' },
          { drugName: 'Augmentin 625mg', dosage: '625mg PO', frequency: 'TDS', durationDays: 5, instructions: 'Oral antibiotic follow-up' }
        );
      }

      // 3. Insert items
      for (const item of mergedItems) {
        await connection.query(
          `INSERT INTO prescription_items 
            (prescription_id, drug_name, dosage, frequency, duration_days, instructions, dispense_status)
           VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
          [
            prescriptionId,
            item.drugName || item.drug_name,
            item.dosage,
            item.frequency,
            item.durationDays || item.duration_days || 1,
            item.instructions || null
          ]
        );
      }

      // 4. Create direct Lab Orders if specified
      const createdLabOrders = [];
      if (labTestIds && labTestIds.length > 0) {
        for (const testId of labTestIds) {
          const barcode = `SPEC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
          const [labRes] = await connection.query(
            `INSERT INTO lab_orders (specimen_barcode, patient_id, test_id, doctor_id, order_status)
             VALUES (?, ?, ?, ?, 'SAMPLE_COLLECTED')`,
            [barcode, patientId, testId, doctorId]
          );
          createdLabOrders.push({ labOrderId: labRes.insertId, specimenBarcode: barcode });
        }
      }

      // 5. Update appointment status to COMPLETED if linked
      if (appointmentId) {
        await connection.query(
          'UPDATE appointments SET queue_status = "COMPLETED" WHERE appointment_id = ?',
          [appointmentId]
        );
      }

      await connection.commit();

      const [rxItems] = await pool.query(
        'SELECT * FROM prescription_items WHERE prescription_id = ?',
        [prescriptionId]
      );

      return {
        prescriptionId,
        patientId,
        itemsCount: rxItems.length,
        items: rxItems,
        labOrders: createdLabOrders
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async logVerbalOrder({ patientId, orderedByDoctorId, receivedByNurseId, orderDetails }) {
    const [result] = await pool.query(
      `INSERT INTO verbal_order_logs 
        (patient_id, ordered_by_doctor_id, received_by_nurse_id, order_details, is_signed_within_24hr)
       VALUES (?, ?, ?, ?, 0)`,
      [patientId, orderedByDoctorId, receivedByNurseId, orderDetails]
    );

    const [[order]] = await pool.query(
      `SELECT vo.*, p.full_name AS patient_name, d.full_name AS doctor_name, n.full_name AS nurse_name
       FROM verbal_order_logs vo
       JOIN patients p ON vo.patient_id = p.patient_id
       JOIN users d ON vo.ordered_by_doctor_id = d.user_id
       JOIN users n ON vo.received_by_nurse_id = n.user_id
       WHERE vo.verbal_order_id = ?`,
      [result.insertId]
    );

    return order;
  }

  async signVerbalOrder(verbalOrderId, doctorId) {
    await pool.query(
      `UPDATE verbal_order_logs 
       SET is_signed_within_24hr = 1, doctor_signed_at = NOW()
       WHERE verbal_order_id = ?`,
      [verbalOrderId]
    );

    const [[order]] = await pool.query(
      'SELECT * FROM verbal_order_logs WHERE verbal_order_id = ?',
      [verbalOrderId]
    );
    return order;
  }

  async getVerbalOrders() {
    const [orders] = await pool.query(`
      SELECT 
        vo.verbal_order_id,
        vo.patient_id,
        vo.ordered_by_doctor_id,
        vo.received_by_nurse_id,
        vo.order_details,
        vo.is_signed_within_24hr,
        vo.doctor_signed_at,
        vo.created_at,
        TIMESTAMPDIFF(HOUR, vo.created_at, NOW()) AS hours_elapsed,
        p.mrn,
        p.full_name AS patient_name,
        d.full_name AS doctor_name,
        n.full_name AS nurse_name
      FROM verbal_order_logs vo
      JOIN patients p ON vo.patient_id = p.patient_id
      JOIN users d ON vo.ordered_by_doctor_id = d.user_id
      JOIN users n ON vo.received_by_nurse_id = n.user_id
      ORDER BY vo.is_signed_within_24hr ASC, vo.verbal_order_id DESC
    `);
    return orders;
  }
}

module.exports = new DoctorService();

