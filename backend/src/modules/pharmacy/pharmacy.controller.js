const pharmacyService = require('./pharmacy.service');

class PharmacyController {
  async getInventory(req, res) {
    try {
      const { search, lasaOnly } = req.query;
      const inventory = await pharmacyService.getInventory({
        search,
        lasaOnly: lasaOnly === 'true'
      });
      return res.json({ success: true, data: inventory });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPendingPrescriptions(req, res) {
    try {
      const list = await pharmacyService.getPendingPrescriptions();
      return res.json({ success: true, data: list });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async dispense(req, res) {
    try {
      const { patientId, prescriptionId, items } = req.body;
      const cashierId = req.user?.user_id;
      const result = await pharmacyService.dispenseAtomic({
        patientId,
        prescriptionId,
        cashierId,
        items
      });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCrashCartLogs(req, res) {
    try {
      const logs = await pharmacyService.getCrashCartLogs();
      return res.json({ success: true, data: logs });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyCrashCart(req, res) {
    try {
      const log = await pharmacyService.verifyCrashCart({
        ...req.body,
        verifiedByNurseId: req.user?.user_id
      });
      return res.status(201).json({ success: true, message: 'Crash Cart verified & sealed', data: log });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PharmacyController();

