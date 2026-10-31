const pool = require('../../config/db');

class AuditService {
  async getKphccEvaluations() {
    const [evals] = await pool.query(
      'SELECT * FROM kphcc_audit_evaluations ORDER BY audit_date DESC LIMIT 20'
    );
    return evals;
  }

  async recordKphccEvaluation({ auditDate, passingIndicators }) {
    const totalIndicators = 122;
    const passing = parseInt(passingIndicators, 10);
    const scorePct = parseFloat(((passing / totalIndicators) * 100).toFixed(2));
    const isCompliant = scorePct >= 80.0 ? 1 : 0;
    const date = auditDate || new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO kphcc_audit_evaluations 
        (audit_date, indicator_count, passing_indicators, is_compliant_category_2b)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        passing_indicators = VALUES(passing_indicators),
        is_compliant_category_2b = VALUES(is_compliant_category_2b),
        evaluated_at = NOW()`,
      [date, totalIndicators, passing, isCompliant]
    );

    const [[saved]] = await pool.query(
      'SELECT * FROM kphcc_audit_evaluations WHERE audit_date = ?',
      [date]
    );

    return {
      evaluation: saved,
      compliant: isCompliant === 1,
      standardBadge: isCompliant === 1 ? 'KP-HCC MSDS CATEGORY 2-B CERTIFIED (>= 80%)' : 'NON-COMPLIANT (< 80%)'
    };
  }

  async getFixedAssets() {
    const [assets] = await pool.query(`
      SELECT 
        fa.*,
        DATEDIFF(fa.next_calibration_due, CURDATE()) AS days_to_calibration,
        CASE
          WHEN fa.next_calibration_due < CURDATE() THEN 'OVERDUE'
          WHEN fa.next_calibration_due <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'DUE_SOON'
          ELSE 'CALIBRATED_VALID'
        END AS calibration_status
      FROM fixed_assets fa
      ORDER BY fa.next_calibration_due ASC
    `);
    return assets;
  }

  async createOrUpdateAsset(asset) {
    const [res] = await pool.query(
      `INSERT INTO fixed_assets 
        (asset_code, asset_name, department, model_number, serial_number, last_calibration_date, next_calibration_due)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        asset_name = VALUES(asset_name),
        department = VALUES(department),
        model_number = VALUES(model_number),
        serial_number = VALUES(serial_number),
        last_calibration_date = VALUES(last_calibration_date),
        next_calibration_due = VALUES(next_calibration_due)`,
      [
        asset.assetCode || asset.asset_code,
        asset.assetName || asset.asset_name,
        asset.department,
        asset.modelNumber || asset.model_number || null,
        asset.serialNumber || asset.serial_number || null,
        asset.lastCalibrationDate || asset.last_calibration_date || null,
        asset.nextCalibrationDue || asset.next_calibration_due || null
      ]
    );

    const [[saved]] = await pool.query(
      'SELECT * FROM fixed_assets WHERE asset_code = ?',
      [asset.assetCode || asset.asset_code]
    );
    return saved;
  }
}

module.exports = new AuditService();

