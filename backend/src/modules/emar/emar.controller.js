const emarService = require('./emar.service');

class EmarController {
  async getScheduled(req, res) {
    try {
      const list = await emarService.getScheduledAdministrations();
      return res.json({ success: true, data: list });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async validateAndAdminister(req, res) {
    try {
      const { admissionId, scannedWristbandCode, prescriptionItemId, scannedDrugBarcode, dosageGiven } = req.body;
      const nurseId = req.user?.user_id;

      if (!admissionId || !scannedWristbandCode || !prescriptionItemId || !scannedDrugBarcode) {
        return res.status(400).json({
          success: false,
          message: 'All 5-Rights inputs required: admissionId, scannedWristbandCode, prescriptionItemId, scannedDrugBarcode'
        });
      }

      const result = await emarService.validateAndAdminister({
        admissionId,
        scannedWristbandCode,
        prescriptionItemId,
        scannedDrugBarcode,
        nurseId,
        dosageGiven
      });

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getRecent(req, res) {
    try {
      const rows = await emarService.getRecentAdministrations();
      return res.json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTemperatureLogs(req, res) {
    try {
      const { wardId } = req.query;
      const logs = await emarService.getTemperatureLogs(wardId);
      return res.json({ success: true, data: logs });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async logTemperature(req, res) {
    try {
      const { wardId, fridgeId, tempCelsius } = req.body;
      const nurseId = req.user?.user_id;
      const result = await emarService.logTemperature({
        wardId,
        fridgeId,
        tempCelsius: parseFloat(tempCelsius),
        recordedByNurseId: nurseId
      });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new EmarController();

