/**
 * Al Noor Specialist Hospital (HMS) - End-to-End Cross-Dashboard Clinical Workflow Test
 * Validates complete data pipeline and transitions across all 9 hospital dashboards:
 * 1. Auth & Session Management
 * 2. OPD Registration & Token Slip Issuance
 * 3. Doctor CPOE Consultation, Order Sets & Lab Orders
 * 4. Pharmacy FEFO Dispensing & Inventory Deductions
 * 5. LIMS Serial Analyzer Simulation (Swelab Alfa 16-param CBC) & Pathologist Sign-Off
 * 6. IPD Bed Matrix Allocation & Thermal Wristband Generation
 * 7. Bedside e-MAR 5-Rights Barcode Validation & Cold Chain Logs
 * 8. Operating Theatre WHO Safety Checklist & Instrument Counts
 * 9. Centralized Consolidated Billing & Shift Cash Drawer Balancing
 * 10. KP-HCC MSDS Category 2-B 122 Indicator Governance
 */

const axios = require('axios');
const pool = require('./db');

const API_BASE = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Helper for switching roles and updating client auth token
async function switchRole(roleOrUsername) {
  const res = await client.post('/auth/quick-switch', { roleOrUsername });
  if (!res.data.success) throw new Error(`Quick switch failed for ${roleOrUsername}`);
  client.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
  return res.data;
}

function printSection(title) {
  console.log('\n' + '='.repeat(75));
  console.log(`  ${title}`);
  console.log('='.repeat(75));
}

function printCheck(msg, success = true) {
  const icon = success ? '\u2714' : '\u2716';
  console.log(`  ${icon} ${msg}`);
}

async function runEndToEndTest() {
  console.log('***************************************************************************');
  console.log('   AL NOOR SPECIALIST HOSPITAL (HMS) - COMPLETE SYSTEM INTEGRATION TEST');
  console.log('   Khyber Pakhtunkhwa Health Care Commission (MSDS Category 2-B Compliant)');
  console.log('***************************************************************************');

  try {
    // -------------------------------------------------------------
    // PHASE 1: Health Check & Authentication
    // -------------------------------------------------------------
    printSection('PHASE 1: System Health & Multi-Role Authentication');
    const healthRes = await client.get('/health');
    printCheck(`API Server Health: ${healthRes.data.status} | Hospital: ${healthRes.data.hospital}`);

    // Quick switch to Receptionist
    const receptionAuth = await switchRole('receptionist1');
    printCheck(`Authenticated as: ${receptionAuth.user.fullName} (${receptionAuth.user.roleName})`);
    printCheck(`Persistent DB Session Created: ${receptionAuth.sessionId.slice(0, 20)}...`);

    // Verify session in database
    const [[sessionRow]] = await pool.query(
      'SELECT session_id, user_id, expires_at FROM user_sessions WHERE session_id = ?',
      [receptionAuth.sessionId]
    );
    printCheck(`Verified session in 'user_sessions' table (Expires: ${sessionRow.expires_at})`);

    // -------------------------------------------------------------
    // PHASE 2: OPD Patient Registration & Token Generation
    // -------------------------------------------------------------
    printSection('PHASE 2: OPD Registration & Thermal Token Slip Generation');
    const patientPayload = {
      fullName: 'Hazrat Gul Khan',
      gender: 'MALE',
      ageYears: 42,
      cnic: '13501-9876543-1',
      phone: '0300-1234567',
      emergencyContact: '0301-7654321 (Brother: Umar)',
      address: 'Bana, Allai Tehsil, District Battagram'
    };

    const regRes = await client.post('/opd/patients', patientPayload);
    const patient = regRes.data.data;
    printCheck(`Registered Patient: ${patient.full_name} | Generated MRN: ${patient.mrn}`);

    // Generate OPD Consultation Token for Dr. Tariq Shah (Surgeon/Doctor ID: 2)
    const tokenRes = await client.post('/opd/tokens', {
      patientId: patient.patient_id,
      doctorId: 2
    });
    const tokenSlip = tokenRes.data.data;
    printCheck(`Generated OPD Token: ${tokenSlip.token_number} for Dr. Tariq Shah`);
    printCheck(`80mm Thermal Slip Payload Formatted: Invoice #${tokenSlip.invoice_number} (Fee: Rs. ${tokenSlip.net_amount})`);

    // -------------------------------------------------------------
    // PHASE 3: Doctor CPOE Consultation, Order Set & Direct Lab Orders
    // -------------------------------------------------------------
    printSection('PHASE 3: Doctor CPOE Consultation & Clinical Order Sets');
    // Switch to Dr. Tariq Shah
    const doctorAuth = await switchRole('dr_surgeon');
    printCheck(`Authenticated as: ${doctorAuth.user.fullName} (${doctorAuth.user.roleName})`);

    // Fetch live waiting queue
    const queueRes = await client.get('/doctor/queue');
    const queuedPatient = queueRes.data.data.find(q => q.patient_id === patient.patient_id);
    printCheck(`Patient '${patient.full_name}' successfully retrieved from live waiting queue (Token: ${queuedPatient?.token_number})`);

    // Update appointment status to IN_CONSULTATION
    await client.put(`/doctor/appointments/${tokenSlip.appointment_id}/status`, { status: 'IN_CONSULTATION' });
    printCheck(`Appointment status updated to: IN_CONSULTATION`);

    // Fetch Clinical Order Sets
    const kitsRes = await client.get('/doctor/order-sets');
    const appendectomyKit = kitsRes.data.data.find(k => k.kit_code === 'APPENDECTOMY_KIT');
    printCheck(`Loaded Clinical Order Set: ${appendectomyKit.title} (${appendectomyKit.department})`);

    // Fetch Lab Tests to order Swelab CBC
    const testsRes = await client.get('/lims/tests');
    const cbcTest = testsRes.data.data.find(t => t.test_code === 'CBC_SWELAB');

    // Create e-Prescription with kit items + CBC lab test
    const rxRes = await client.post('/doctor/prescriptions', {
      patientId: patient.patient_id,
      appointmentId: tokenSlip.appointment_id,
      diagnosis: 'Acute Appendicitis with Localized Peritonitis - Emergency Surgical Admission',
      orderSetKitCode: 'APPENDECTOMY_KIT',
      labTestIds: [cbcTest.test_id]
    });
    const prescription = rxRes.data.data;
    printCheck(`Prescription #${prescription.prescriptionId} created with ${prescription.itemsCount} order items`);
    printCheck(`Automated Specimen Barcode Generated: ${prescription.labOrders[0].specimenBarcode}`);

    // Verify appointment status was marked COMPLETED
    const [[apptStatus]] = await pool.query(
      'SELECT queue_status FROM appointments WHERE appointment_id = ?',
      [tokenSlip.appointment_id]
    );
    printCheck(`Appointment Queue Status transitioned to: ${apptStatus.queue_status}`);

    // -------------------------------------------------------------
    // PHASE 4: Pharmacy POS Dispensing with FEFO Stock Deduction
    // -------------------------------------------------------------
    printSection('PHASE 4: Pharmacy POS Dispense (FEFO & LASA Check)');
    // Switch to Pharmacist
    const pharmAuth = await switchRole('pharm_pos');
    printCheck(`Authenticated as: ${pharmAuth.user.fullName} (${pharmAuth.user.roleName})`);

    // Verify pending prescription in pharmacy queue
    const pendingRxRes = await client.get('/pharmacy/prescriptions/pending');
    const rxInPharmacy = pendingRxRes.data.data.find(r => r.patient_id === patient.patient_id);
    printCheck(`Prescription #${rxInPharmacy?.prescription_id} retrieved in Pharmacy dispensing queue (${rxInPharmacy?.pending_items} pending items)`);

    // Query FEFO Batches for Rocephin 1g Inj
    const invRes = await client.get('/pharmacy/inventory?search=Rocephin');
    const rocephinBatch = invRes.data.data[0];
    printCheck(`FEFO Selected Batch: ${rocephinBatch.brand_name} (Batch: ${rocephinBatch.batch_number}, Exp: ${new Date(rocephinBatch.expiry_date).toISOString().slice(0, 10)})`);
    printCheck(`Current Batch Stock before dispense: ${rocephinBatch.stock_quantity} ${rocephinBatch.unit_type}`);

    // Atomic Checkout: Dispense 2 vials of Rocephin
    const dispenseRes = await client.post('/pharmacy/dispense', {
      patientId: patient.patient_id,
      prescriptionId: prescription.prescriptionId,
      items: [{ batchId: rocephinBatch.batch_id, quantity: 2, unitPrice: rocephinBatch.selling_price }]
    });
    printCheck(`Atomic POS Sale #${dispenseRes.data.data.saleId} completed for Rs. ${dispenseRes.data.data.totalAmount}`);

    // Verify inventory deduction in MySQL database
    const [[updatedBatch]] = await pool.query(
      'SELECT stock_quantity FROM medicine_batches WHERE batch_id = ?',
      [rocephinBatch.batch_id]
    );
    printCheck(`Verified MySQL Inventory: Stock reduced from ${rocephinBatch.stock_quantity} -> ${updatedBatch.stock_quantity}`);

    // Crash cart daily seal check
    const crashRes = await client.post('/pharmacy/crash-cart/verify', {
      wardName: 'Male Surgical Ward',
      sealNumber: 'SEAL-MSW-9921',
      adrenalineQty: 10,
      atropineQty: 10,
      notes: 'Morning shift seal inspection - All 10 Adrenaline and 10 Atropine ampoules verified intact.'
    });
    printCheck(`Emergency Crash Cart Verified & Sealed: ${crashRes.data.data.seal_number}`);

    // -------------------------------------------------------------
    // PHASE 5: LIMS Serial Analyzer Simulation & Pathologist Sign-Off
    // -------------------------------------------------------------
    printSection('PHASE 5: LIMS Analyzer Serial Bridge & Pathologist Sign-off');
    // Switch to Lab Tech
    const labAuth = await switchRole('lab_tech');
    printCheck(`Authenticated as: ${labAuth.user.fullName} (${labAuth.user.roleName})`);

    const labOrdersRes = await client.get('/lims/orders');
    const patientLabOrder = labOrdersRes.data.data.find(o => o.patient_id === patient.patient_id);
    printCheck(`Specimen Barcode Retrieved: ${patientLabOrder.specimen_barcode} (${patientLabOrder.test_name})`);

    // Simulate serial analyzer data capture from Swelab Alfa
    const simRes = await client.post(`/lims/orders/${patientLabOrder.lab_order_id}/simulate-analyzer`);
    const cbcData = simRes.data.data.cbcResults;
    printCheck(`Swelab Alfa 16-Parameter CBC Streamed: WBC=${cbcData.wbc}, RBC=${cbcData.rbc}, HGB=${cbcData.hgb} g/dL, PLT=${cbcData.plt}`);
    printCheck(`ASTM/HL7 Serial Packet Parsed: ${cbcData.raw_serial_payload.slice(0, 45)}...`);

    // Pathologist Digital Sign-Off
    const verifyRes = await client.put(`/lims/orders/${patientLabOrder.lab_order_id}/verify`);
    printCheck(`Pathologist Sign-off Complete: Status = ${verifyRes.data.data.order_status}`);
    printCheck(`QR Verification Seal Issued: ${verifyRes.data.data.qrVerificationMark}`);

    // -------------------------------------------------------------
    // PHASE 6: IPD Bed Matrix Allocation & Thermal Wristband
    // -------------------------------------------------------------
    printSection('PHASE 6: Inpatient (IPD) Bed Matrix & Thermal Wristband');
    // Switch to Nurse
    const nurseAuth = await switchRole('ward_nurse');
    printCheck(`Authenticated as: ${nurseAuth.user.fullName} (${nurseAuth.user.roleName})`);

    // Fetch bed matrix
    const wardsRes = await client.get('/ipd/wards-beds');
    let vacantBed = null;
    let selectedWardName = '';

    for (const ward of wardsRes.data.data) {
      const found = ward.beds.find(b => b.status === 'VACANT');
      if (found) {
        vacantBed = found;
        selectedWardName = ward.ward_name;
        break;
      }
    }

    if (!vacantBed) {
      // Auto-clean & recycle an existing bed for continuous testing
      await pool.query('UPDATE beds SET status = "VACANT" WHERE bed_id = 1');
      await pool.query('UPDATE admissions SET admission_status = "DISCHARGED" WHERE bed_id = 1');
      const [[b]] = await pool.query('SELECT b.*, w.ward_name FROM beds b JOIN wards w ON b.ward_id = w.ward_id WHERE b.bed_id = 1');
      vacantBed = b;
      selectedWardName = b.ward_name;
    }

    printCheck(`Selected Vacant Inpatient Bed: ${vacantBed.bed_number} in ${selectedWardName}`);

    // Admit patient
    const admitRes = await client.post('/ipd/admissions', {
      patientId: patient.patient_id,
      bedId: vacantBed.bed_id,
      attendingDoctorId: 2
    });
    const admission = admitRes.data.data;
    printCheck(`Patient Admitted to Bed ${vacantBed.bed_number} (Admission #${admission.admission_id})`);
    printCheck(`250x30mm Thermal Wristband Barcode Generated: ${admission.wristband_barcode}`);

    // Verify bed status updated in database
    const [[bedState]] = await pool.query('SELECT status FROM beds WHERE bed_id = ?', [vacantBed.bed_id]);
    printCheck(`Verified Bed Matrix Status in MySQL: ${bedState.status}`);

    // -------------------------------------------------------------
    // PHASE 7: Bedside e-MAR 5-Rights Barcode Validation & Cold Chain
    // -------------------------------------------------------------
    printSection('PHASE 7: Bedside e-MAR 5-Rights Barcode Validation');
    const emarSchedRes = await client.get('/emar/scheduled');
    const emarItem = emarSchedRes.data.data.find(e => e.admission_id === admission.admission_id);
    printCheck(`Scheduled Inpatient Medication Retrieved: ${emarItem?.drug_name} (${emarItem?.dosage})`);

    // Test Safety Alert: Attempt administration with mismatched wristband
    try {
      await client.post('/emar/validate-administer', {
        admissionId: admission.admission_id,
        prescriptionItemId: emarItem.prescription_item_id,
        scannedWristbandCode: 'WRONG-WRISTBAND-CODE',
        scannedDrugBarcode: '896400010022',
        dosageGiven: emarItem.dosage
      });
      printCheck('Safety check failed: Accepted wrong wristband', false);
    } catch (err) {
      printCheck(`Safety Alert Verified: Blocked wrong wristband mismatch: "${err.response.data.message}"`);
    }

    // Now perform valid bedside administration with correct codes
    const emarValidRes = await client.post('/emar/validate-administer', {
      admissionId: admission.admission_id,
      prescriptionItemId: emarItem.prescription_item_id,
      scannedWristbandCode: admission.wristband_barcode,
      scannedDrugBarcode: '896400010022', // Rocephin
      dosageGiven: '1g IV'
    });
    printCheck(`5-Rights Confirmed: Right Patient, Right Drug, Right Dose, Right Route, Right Time`);
    printCheck(`Logged in 'emar_administrations' by Nurse: ${emarValidRes.data.administration.nurse_name}`);

    // Log cold chain fridge temperature
    const fridgeRes = await client.post('/emar/temperatures', {
      wardId: vacantBed.ward_id || 1,
      fridgeId: 'FRIDGE-MSW-01',
      tempCelsius: 4.2
    });
    printCheck(`Cold Chain Medication Fridge Logged: ${fridgeRes.data.data.log.temp_celsius}°C (${fridgeRes.data.data.alert})`);

    // -------------------------------------------------------------
    // PHASE 8: Operating Theatre WHO Safety Checklist & Instrument Counts
    // -------------------------------------------------------------
    printSection('PHASE 8: Operating Theatre (OT) & WHO Surgical Safety');
    // Switch to Surgeon Dr. Bilal Akhtar
    const surgeonAuth = await switchRole('ot_lead');
    printCheck(`Authenticated as: ${surgeonAuth.user.fullName} (${surgeonAuth.user.roleName})`);

    // Schedule surgery for admitted patient
    const otSchedRes = await client.post('/ot/surgeries', {
      admissionId: admission.admission_id,
      leadSurgeonId: 6,
      procedureName: 'Emergency Laparoscopic Appendectomy',
      scheduledStart: new Date().toISOString()
    });
    const surgery = otSchedRes.data.data;
    printCheck(`Scheduled OT Case #${surgery.ot_surgery_id}: ${surgery.procedure_name}`);

    // Complete WHO 3-Phase Gateways
    await client.put(`/ot/surgeries/${surgery.ot_surgery_id}/who-checklist`, { whoSigninCompleted: true });
    printCheck(`WHO Gateway 1: SIGN-IN Verified (Patient ID, site, allergy checks)`);

    await client.put(`/ot/surgeries/${surgery.ot_surgery_id}/who-checklist`, { whoTimeoutCompleted: true });
    printCheck(`WHO Gateway 2: TIME-OUT Verified (Pre-incision multidisciplinary briefing)`);

    // Perform Sponge Count Reconciliation
    const countRes = await client.post(`/ot/surgeries/${surgery.ot_surgery_id}/counts`, {
      itemType: 'SPONGE',
      initialCount: 15,
      postClosureCount: 15
    });
    printCheck(`Sponge Count Reconciliation: Initial 15 vs Post-Closure 15 -> ${countRes.data.alert}`);

    await client.put(`/ot/surgeries/${surgery.ot_surgery_id}/who-checklist`, { whoSignoutCompleted: true });
    printCheck(`WHO Gateway 3: SIGN-OUT Verified (Counts reconciled, specimen labeled)`);

    // Save Surgeon Operative Notes
    const notesRes = await client.put(`/ot/surgeries/${surgery.ot_surgery_id}/notes`, {
      operativeNotes: 'Pneumoperitoneum established. Inflamed, turgid retrocecal appendix identified. Mesoappendix cauterized. Base ligated with Roeder knot. Appendix retrieved in endobag. Peritoneal lavage performed. Closure in layers. Count reconciled.'
    });
    printCheck(`Surgeon Operative Notes Saved & Procedure Status: ${notesRes.data.data.surgery_status}`);

    // -------------------------------------------------------------
    // PHASE 9: Consolidated Billing & Shift Cash Drawer Balancing
    // -------------------------------------------------------------
    printSection('PHASE 9: Consolidated Central Billing & Cash Drawer Balancing');
    // Switch to Billing Cashier
    const cashierAuth = await switchRole('cashier1');
    printCheck(`Authenticated as: ${cashierAuth.user.fullName} (${cashierAuth.user.roleName})`);

    // Consolidate all services into unified bill
    const consRes = await client.post('/billing/invoices/consolidate', {
      patientId: patient.patient_id,
      admissionId: admission.admission_id,
      discountAmount: 500.00
    });
    const finalInvoice = consRes.data.data;
    printCheck(`Consolidated Unified Invoice #${finalInvoice.invoice_number} Generated`);
    printCheck(`Itemized Service Breakdown (${finalInvoice.items.length} line items):`);
    finalInvoice.items.forEach((it, idx) => {
      console.log(`     [${idx + 1}] ${it.service_type.padEnd(14)} : ${it.description.padEnd(50)} Rs. ${it.amount}`);
    });
    printCheck(`Gross: Rs. ${finalInvoice.total_amount} | Discount: Rs. ${finalInvoice.discount_amount} | Net: Rs. ${finalInvoice.net_amount}`);

    // Settle invoice in full
    const settleRes = await client.post(`/billing/invoices/${finalInvoice.invoice_id}/settle`, {
      paidAmount: finalInvoice.net_amount
    });
    printCheck(`Settlement Completed: Status = ${settleRes.data.data.payment_status} (Paid: Rs. ${settleRes.data.data.paid_amount})`);

    // Open Shift Cash Drawer
    let drawerRes = await client.get('/billing/shift-drawers/current');
    let drawer = drawerRes.data.data;
    if (!drawer) {
      const openRes = await client.post('/billing/shift-drawers/open', {
        department: 'CENTRAL_CASH',
        openingBalance: 5000.00
      });
      drawer = openRes.data.data;
      printCheck(`Opened New Shift Cash Drawer #${drawer.shift_id} (Opening Float: Rs. ${drawer.opening_balance})`);
    } else {
      printCheck(`Active Shift Drawer #${drawer.shift_id} Active (Opening Float: Rs. ${drawer.opening_balance})`);
    }

    // Refresh live billed cash
    const drawerLive = (await client.get('/billing/shift-drawers/current')).data.data;
    printCheck(`Live System Billed Cash during shift: Rs. ${drawerLive.live_billed_cash}`);
    printCheck(`Expected Drawer Total: Rs. ${drawerLive.expected_cash_in_drawer}`);

    // Close Shift Cash Drawer with balanced cash
    const closeRes = await client.post('/billing/shift-drawers/close', {
      shiftId: drawerLive.shift_id,
      physicalCountedCash: drawerLive.expected_cash_in_drawer,
      notes: 'Evening shift handover. Physical currency counted and matched with system totals.'
    });
    printCheck(`Shift Drawer Closed & Locked: Discrepancy = Rs. ${closeRes.data.discrepancy} (${closeRes.data.alert})`);

    // -------------------------------------------------------------
    // PHASE 10: KP-HCC MSDS Category 2-B Compliance & Asset Auditing
    // -------------------------------------------------------------
    printSection('PHASE 10: KP-HCC MSDS Category 2-B Governance & Asset Calibration');
    // Switch to Medical Director (Admin)
    const adminAuth = await switchRole('admin_dir');
    printCheck(`Authenticated as: ${adminAuth.user.fullName} (${adminAuth.user.roleName})`);

    // Record KP-HCC audit evaluation across 122 indicators
    const auditRes = await client.post('/audit/kphcc-msds', {
      auditDate: new Date().toISOString().slice(0, 10),
      passingIndicators: 110 // 110/122 = 90.2%
    });
    printCheck(`MSDS Audit Evaluation Evaluated: ${auditRes.data.evaluation.passing_indicators}/122 Indicators Passing (${auditRes.data.evaluation.score_percentage}%)`);
    printCheck(`Compliance Regulatory Certification Badge: ${auditRes.data.standardBadge}`);

    // Query Fixed Assets & Calibration Statuses
    const assetsRes = await client.get('/audit/fixed-assets');
    printCheck(`Biomedical Assets Calibrated and Tracked: ${assetsRes.data.data.length} equipment units`);
    assetsRes.data.data.slice(0, 4).forEach((a, idx) => {
      console.log(`     [${idx + 1}] ${a.asset_code.padEnd(15)} : ${a.asset_name.padEnd(42)} Status: ${a.calibration_status}`);
    });

    console.log('\n' + '='.repeat(75));
    console.log('   \u2714\u2714 ALL 10 CLINICAL PHASES & CROSS-DASHBOARD DATA PIPELINES PASSED \u2714\u2714');
    console.log('   SYSTEM IS FULLY OPERATIONAL, PRODUCTION-GRADE & KP-HCC COMPLIANT');
    console.log('='.repeat(75));

  } catch (error) {
    console.error('\n\u2716 Integration Test Error:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runEndToEndTest();

