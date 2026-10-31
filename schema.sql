-- =============================================================================
-- AL NOOR SPECIALIST HOSPITAL (LMS) - COMPREHENSIVE DATABASE SCHEMA DICTIONARY
-- Database: hospital_management | Total Tables: 29 | Storage Engine: InnoDB
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. AUTHENTICATION & ACCESS CONTROL (RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    cnic VARCHAR(15) NULL,
    phone VARCHAR(20) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- -----------------------------------------------------------------------------
-- 2. PATIENT REGISTRATION & APPOINTMENTS (OPD / ER)
-- -----------------------------------------------------------------------------
CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    mrn VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    gender ENUM('MALE','FEMALE','OTHER') NOT NULL,
    dob DATE NULL,
    age_years INT NULL,
    cnic VARCHAR(15) NULL,
    phone VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(100) NULL,
    address TEXT NULL,
    is_emergency_bypass TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    queue_status ENUM('WAITING','IN_CONSULTATION','COMPLETED','CANCELLED') DEFAULT 'WAITING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES users(user_id)
);

-- -----------------------------------------------------------------------------
-- 3. CLINICAL ORDERS, E-PRESCRIPTIONS & VERBAL ORDERS
-- -----------------------------------------------------------------------------
CREATE TABLE clinical_order_sets (
    order_set_id INT AUTO_INCREMENT PRIMARY KEY,
    kit_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    department ENUM('SURGERY','EMERGENCY','OPD','GENERAL') NOT NULL,
    description TEXT NULL
);

CREATE TABLE prescriptions (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT NULL,
    diagnosis TEXT NULL,
    is_locked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES users(user_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
);

CREATE TABLE prescription_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    drug_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    instructions TEXT NULL,
    dispense_status ENUM('PENDING','DISPENSED','CANCELLED') DEFAULT 'PENDING',
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id)
);

CREATE TABLE verbal_order_logs (
    verbal_order_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    ordered_by_doctor_id INT NOT NULL,
    received_by_nurse_id INT NOT NULL,
    order_details TEXT NOT NULL,
    is_signed_within_24hr TINYINT(1) DEFAULT 0,
    doctor_signed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (ordered_by_doctor_id) REFERENCES users(user_id),
    FOREIGN KEY (received_by_nurse_id) REFERENCES users(user_id)
);

-- -----------------------------------------------------------------------------
-- 4. PHARMACY POS, FEFO INVENTORY & CRASH CARTS
-- -----------------------------------------------------------------------------
CREATE TABLE medicines (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    barcode VARCHAR(64) UNIQUE,
    is_lasa TINYINT(1) DEFAULT 0,
    unit_type VARCHAR(30) DEFAULT 'TABLET',
    reorder_level INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicine_batches (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_locked_fefo TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);

CREATE TABLE pharmacy_sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NULL,
    prescription_id INT NULL,
    cashier_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('PAID','PENDING','CANCELLED') DEFAULT 'PAID',
    sale_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id),
    FOREIGN KEY (cashier_id) REFERENCES users(user_id)
);

CREATE TABLE pharmacy_sale_items (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    batch_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES pharmacy_sales(sale_id),
    FOREIGN KEY (batch_id) REFERENCES medicine_batches(batch_id)
);

CREATE TABLE crash_cart_logs (
    cart_log_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_name VARCHAR(50) NOT NULL,
    seal_number VARCHAR(50) NOT NULL,
    verified_by_nurse_id INT NOT NULL,
    adrenaline_qty INT NOT NULL DEFAULT 0,
    atropine_qty INT NOT NULL DEFAULT 0,
    verification_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (verified_by_nurse_id) REFERENCES users(user_id)
);

-- -----------------------------------------------------------------------------
-- 5. LABORATORY (LIMS) & ANALYZER DATA CAPTURE
-- -----------------------------------------------------------------------------
CREATE TABLE lab_tests (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    test_code VARCHAR(30) NOT NULL UNIQUE,
    test_name VARCHAR(150) NOT NULL,
    sample_type VARCHAR(50) NOT NULL DEFAULT 'EDTA_WHOLE_BLOOD',
    standard_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE lab_orders (
    lab_order_id INT AUTO_INCREMENT PRIMARY KEY,
    specimen_barcode VARCHAR(50) NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    test_id INT NOT NULL,
    doctor_id INT NOT NULL,
    order_status ENUM('SAMPLE_COLLECTED','PROCESSING','RESULT_READY','VERIFIED') DEFAULT 'SAMPLE_COLLECTED',
    pathologist_id INT NULL,
    verified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (test_id) REFERENCES lab_tests(test_id),
    FOREIGN KEY (doctor_id) REFERENCES users(user_id),
    FOREIGN KEY (pathologist_id) REFERENCES users(user_id)
);

CREATE TABLE lab_cbc_results (
    cbc_result_id INT AUTO_INCREMENT PRIMARY KEY,
    lab_order_id INT NOT NULL UNIQUE,
    wbc DECIMAL(6,2) NULL,
    rbc DECIMAL(6,2) NULL,
    hgb DECIMAL(6,2) NULL,
    plt DECIMAL(6,1) NULL,
    mcv DECIMAL(6,2) NULL,
    mch DECIMAL(6,2) NULL,
    mchc DECIMAL(6,2) NULL,
    hct DECIMAL(6,2) NULL,
    rdw_pct DECIMAL(6,2) NULL,
    lym_num DECIMAL(6,2) NULL,
    lym_pct DECIMAL(6,2) NULL,
    mid_num DECIMAL(6,2) NULL,
    mid_pct DECIMAL(6,2) NULL,
    gra_num DECIMAL(6,2) NULL,
    gra_pct DECIMAL(6,2) NULL,
    mpv DECIMAL(6,2) NULL,
    raw_serial_payload TEXT NULL,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_order_id) REFERENCES lab_orders(lab_order_id)
);

-- -----------------------------------------------------------------------------
-- 6. INPATIENT (IPD), BED MATRIX & BEDSIDE e-MAR
-- -----------------------------------------------------------------------------
CREATE TABLE wards (
    ward_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL UNIQUE,
    ward_type ENUM('SURGICAL','MEDICAL','ICU','EMERGENCY','PEDIATRIC') NOT NULL
);

CREATE TABLE beds (
    bed_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_id INT NOT NULL,
    bed_number VARCHAR(20) NOT NULL,
    status ENUM('VACANT','OCCUPIED','DIRTY','MAINTENANCE') DEFAULT 'VACANT',
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id)
);

CREATE TABLE admissions (
    admission_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    bed_id INT NOT NULL,
    wristband_barcode VARCHAR(50) NOT NULL UNIQUE,
    admitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discharged_at DATETIME NULL,
    discharge_summary_signed TINYINT(1) DEFAULT 0,
    attending_doctor_id INT NOT NULL,
    admission_status ENUM('ACTIVE','DISCHARGED','TRANSFERRED') DEFAULT 'ACTIVE',
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (bed_id) REFERENCES beds(bed_id),
    FOREIGN KEY (attending_doctor_id) REFERENCES users(user_id)
);

CREATE TABLE emar_administrations (
    emar_id INT AUTO_INCREMENT PRIMARY KEY,
    admission_id INT NOT NULL,
    prescription_item_id INT NOT NULL,
    nurse_id INT NOT NULL,
    scanned_wristband_code VARCHAR(50) NOT NULL,
    scanned_drug_barcode VARCHAR(64) NOT NULL,
    is_five_rights_verified TINYINT(1) DEFAULT 1,
    dosage_given VARCHAR(50) NOT NULL,
    administered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admission_id) REFERENCES admissions(admission_id),
    FOREIGN KEY (prescription_item_id) REFERENCES prescription_items(item_id),
    FOREIGN KEY (nurse_id) REFERENCES users(user_id)
);

CREATE TABLE ward_temperature_logs (
    temp_log_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_id INT NOT NULL,
    fridge_id VARCHAR(50) NOT NULL,
    temp_celsius DECIMAL(4,2) NOT NULL,
    recorded_by_nurse_id INT NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id),
    FOREIGN KEY (recorded_by_nurse_id) REFERENCES users(user_id)
);

-- -----------------------------------------------------------------------------
-- 7. OPERATING THEATRE (OT) & WHO SURGICAL SAFETY
-- -----------------------------------------------------------------------------
CREATE TABLE ot_surgeries (
    ot_surgery_id INT AUTO_INCREMENT PRIMARY KEY,
    admission_id INT NOT NULL,
    lead_surgeon_id INT NOT NULL,
    procedure_name VARCHAR(200) NOT NULL,
    scheduled_start DATETIME NOT NULL,
    who_signin_completed TINYINT(1) DEFAULT 0,
    who_timeout_completed TINYINT(1) DEFAULT 0,
    who_signout_completed TINYINT(1) DEFAULT 0,
    operative_notes TEXT NULL,
    surgery_status ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admission_id) REFERENCES admissions(admission_id),
    FOREIGN KEY (lead_surgeon_id) REFERENCES users(user_id)
);

CREATE TABLE ot_sponge_instrument_counts (
    count_id INT AUTO_INCREMENT PRIMARY KEY,
    ot_surgery_id INT NOT NULL,
    item_type ENUM('SPONGE','NEEDLE','FORCEPS','SCALPEL','CLAMPS') NOT NULL,
    initial_count INT NOT NULL,
    post_closure_count INT NOT NULL,
    is_reconciled TINYINT(1) DEFAULT 0,
    verified_by_scrub_nurse_id INT NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ot_surgery_id) REFERENCES ot_surgeries(ot_surgery_id),
    FOREIGN KEY (verified_by_scrub_nurse_id) REFERENCES users(user_id)
);

-- -----------------------------------------------------------------------------
-- 8. UNIFIED BILLING & SHIFT CASH DRAWER BALANCING
-- -----------------------------------------------------------------------------
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    admission_id INT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('PAID','PARTIAL','UNPAID') DEFAULT 'UNPAID',
    cashier_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (admission_id) REFERENCES admissions(admission_id),
    FOREIGN KEY (cashier_id) REFERENCES users(user_id)
);

CREATE TABLE invoice_items (
    invoice_item_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    service_type ENUM('OPD_TOKEN','PHARMACY','LAB_TEST','BED_CHARGE','OT_SURGERY') NOT NULL,
    reference_id INT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
);

CREATE TABLE shift_cash_drawers (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    cashier_id INT NOT NULL,
    department ENUM('RECEPTION','PHARMACY','LAB','CENTRAL_CASH') NOT NULL,
    opening_time DATETIME NOT NULL,
    closing_time DATETIME NULL,
    opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    system_billed_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    physical_counted_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discrepancy_amount DECIMAL(10,2) NULL,
    shift_status ENUM('OPEN','CLOSED') DEFAULT 'OPEN',
    reconciliation_notes TEXT NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(user_id)
);

-- -----------------------------------------------------------------------------
-- 9. ASSET INVENTORY & KP-HCC REGULATORY COMPLIANCE
-- -----------------------------------------------------------------------------
CREATE TABLE fixed_assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    asset_name VARCHAR(150) NOT NULL,
    department ENUM('OPD','IPD','LAB','OT','PHARMACY','ADMIN') NOT NULL,
    model_number VARCHAR(100) NULL,
    serial_number VARCHAR(100) NULL,
    last_calibration_date DATE NULL,
    next_calibration_due DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kphcc_audit_evaluations (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    audit_date DATE NOT NULL UNIQUE,
    indicator_count INT DEFAULT 122,
    passing_indicators INT NOT NULL DEFAULT 0,
    score_percentage DECIMAL(5,2) NULL,
    is_compliant_category_2b TINYINT(1) DEFAULT 0,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);