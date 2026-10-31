const auditService = require('./audit.service');

class AuditController {
  async getKphccEvaluations(req, res) {
    try {
      const evaluations = await auditService.getKphccEvaluations();
      return res.json({ success: true, data: evaluations });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async recordKphccEvaluation(req, res) {
    try {
      const { auditDate, passingIndicators } = req.body;
      const result = await auditService.recordKphccEvaluation({
        auditDate,
        passingIndicators: parseInt(passingIndicators, 10)
      });
      return res.status(201).json({ success: true, ...result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getFixedAssets(req, res) {
    try {
      const assets = await auditService.getFixedAssets();
      return res.json({ success: true, data: assets });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async saveFixedAsset(req, res) {
    try {
      const asset = await auditService.createOrUpdateAsset(req.body);
      return res.status(201).json({ success: true, message: 'Asset record updated', data: asset });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuditController();

