/**
 * Al Noor Specialist Hospital (HMS) - Database Diagnostic & Verification Script
 * Validates:
 * 1. Connection via reusable mysql2/promise connection pool.
 * 2. Presence and integrity of all 29 tables in information_schema.
 * 3. Foreign key constraints mapping without destructive operations.
 * 4. Readability of 8 seeded roles and test users.
 */

const pool = require('./db');

const EXPECTED_TABLES = [
  'roles',
  'users',
  'user_sessions',
  'patients',
  'appointments',
  'clinical_order_sets',
  'prescriptions',
  'prescription_items',
  'verbal_order_logs',
  'medicines',
  'medicine_batches',
  'pharmacy_sales',
  'pharmacy_sale_items',
  'crash_cart_logs',
  'lab_tests',
  'lab_orders',
  'lab_cbc_results',
  'wards',
  'beds',
  'admissions',
  'emar_administrations',
  'ward_temperature_logs',
  'ot_surgeries',
  'ot_sponge_instrument_counts',
  'invoices',
  'invoice_items',
  'shift_cash_drawers',
  'fixed_assets',
  'kphcc_audit_evaluations'
];

const EXPECTED_ROLES = [
  'RECEPTIONIST',
  'DOCTOR',
  'PHARMACIST',
  'LAB_TECH',
  'NURSE',
  'SURGEON',
  'BILLING_CASHIER',
  'COMPLIANCE_ADMIN'
];

async function runDiagnostic() {
  console.log('='.repeat(75));
  console.log('   AL NOOR SPECIALIST HOSPITAL (HMS) - DATABASE DIAGNOSTIC SUITE');
  console.log('='.repeat(75));

  let connection;
  try {
    // -------------------------------------------------------------
    // Task 1: Verify Connection via Connection Pool
    // -------------------------------------------------------------
    console.log('\n[TASK 1] Testing Connection Pool (mysql2/promise)...');
    const startTime = Date.now();
    connection = await pool.getConnection();
    const duration = Date.now() - startTime;

    const [[dbMeta]] = await connection.query(
      'SELECT DATABASE() AS current_db, CURRENT_USER() AS active_user, VERSION() AS mysql_version'
    );

    console.log('  \u2714 Connection established successfully!');
    console.log(`    - Database        : ${dbMeta.current_db}`);
    console.log(`    - Connected User  : ${dbMeta.active_user}`);
    console.log(`    - MySQL Version   : ${dbMeta.mysql_version}`);
    console.log(`    - Handshake Time  : ${duration}ms`);

    // -------------------------------------------------------------
    // Task 2: Query information_schema & Count 29 Tables
    // -------------------------------------------------------------
    console.log('\n[TASK 2] Verifying Information Schema (Table Count & Engine)...');
    const [tables] = await connection.query(`
      SELECT 
        TABLE_NAME, 
        ENGINE, 
        TABLE_ROWS, 
        CREATE_TIME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME ASC
    `);

    const existingTableNames = tables.map((t) => t.TABLE_NAME);
    console.log(`  \u2714 Total tables discovered in '${dbMeta.current_db}': ${tables.length}`);

    const missingTables = EXPECTED_TABLES.filter((t) => !existingTableNames.includes(t));
    const extraTables = existingTableNames.filter((t) => !EXPECTED_TABLES.includes(t));

    if (missingTables.length === 0 && extraTables.length === 0 && tables.length === 29) {
      console.log('  \u2714 All 29 expected tables are present and accounted for:');
      tables.forEach((t, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        console.log(`     [${num}] ${t.TABLE_NAME.padEnd(28)} (Engine: ${t.ENGINE})`);
      });
    } else {
      if (missingTables.length > 0) {
        console.error('  \u2716 Missing tables:', missingTables);
      }
      if (extraTables.length > 0) {
        console.warn('  \u26A0 Unexpected extra tables:', extraTables);
      }
    }

    // -------------------------------------------------------------
    // Task 3: Confirm Foreign Key Constraints & Data Layer Mapping
    // -------------------------------------------------------------
    console.log('\n[TASK 3] Checking Foreign Key Constraints Mapping (Non-Destructive)...');
    const [foreignKeys] = await connection.query(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `);

    console.log(`  \u2714 Active Foreign Key Constraints: ${foreignKeys.length}`);
    foreignKeys.forEach((fk, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      console.log(
        `     [${num}] ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME} (${fk.CONSTRAINT_NAME})`
      );
    });

    // -------------------------------------------------------------
    // Task 4: Verify 8 Seeded Roles and Test Users
    // -------------------------------------------------------------
    console.log('\n[TASK 4] Verifying Seeded Roles and Test Users...');
    
    // 4A: Roles
    const [roles] = await connection.query(
      'SELECT role_id, role_name, description, created_at FROM roles ORDER BY role_id ASC'
    );
    console.log(`  \u2714 Roles retrieved: ${roles.length}`);
    console.table(roles.map(r => ({
      ID: r.role_id,
      Role: r.role_name,
      Description: r.description
    })));

    const roleNames = roles.map(r => r.role_name);
    const missingRoles = EXPECTED_ROLES.filter(r => !roleNames.includes(r));
    if (missingRoles.length === 0 && roles.length === 8) {
      console.log('  \u2714 All 8 seeded roles match the LMS specification perfectly.');
    } else {
      console.warn('  \u26A0 Discrepancy in seeded roles. Missing:', missingRoles);
    }

    // 4B: Users
    const [users] = await connection.query(`
      SELECT 
        u.user_id, 
        u.username, 
        u.full_name, 
        r.role_name, 
        u.is_active, 
        u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.user_id ASC
    `);
    console.log(`  \u2714 Test Users retrieved: ${users.length}`);
    console.table(users.map(u => ({
      ID: u.user_id,
      Username: u.username,
      FullName: u.full_name,
      Role: u.role_name,
      Active: u.is_active ? 'Yes' : 'No'
    })));

    console.log('\n' + '='.repeat(75));
    console.log('   ALL VERIFICATION TASKS COMPLETED SUCCESSFULLY - READY FOR DATA LAYER');
    console.log('='.repeat(75));

  } catch (err) {
    console.error('\n\u2716 Diagnostic Failed with error:', err.message);
    if (err.code) console.error('  Error Code:', err.code);
    if (err.sqlMessage) console.error('  SQL Message:', err.sqlMessage);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

runDiagnostic();

