const otService = require('./ot.service');

class OtController {
  async getSurgeries(req, res) {
    try {
      const surgeries = await otService.getSurgeries();
      return res.json({ success: true, data: surgeries });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async scheduleSurgery(req, res) {
    try {
      const { admissionId, leadSurgeonId, procedureName, scheduledStart } = req.body;
      const surgeonId = leadSurgeonId || req.user?.user_id;
      const surgery = await otService.scheduleSurgery({ admissionId, leadSurgeonId: surgeonId, procedureName, scheduledStart });
      return res.status(201).json({ success: true, data: surgery });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateWhoChecklist(req, res) {
    try {
      const { id } = req.params;
      const updated = await otService.updateWhoChecklist(id, req.body);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCounts(req, res) {
    try {
      const counts = await otService.getCounts(req.params.id);
      return res.json({ success: true, data: counts });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async recordCount(req, res) {
    try {
      const { id } = req.params;
      const { itemType, initialCount, postClosureCount } = req.body;
      const verifiedByScrubNurseId = req.user?.user_id;
      const result = await otService.recordCount({
        otSurgeryId: id,
        itemType,
        initialCount,
        postClosureCount,
        verifiedByScrubNurseId
      });
      return res.status(201).json({ success: true, ...result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async saveNotes(req, res) {
    try {
      const { id } = req.params;
      const { operativeNotes } = req.body;
      const updated = await otService.saveOperativeNotes(id, operativeNotes);
      return res.json({ success: true, message: 'Operative notes logged and surgery marked completed', data: updated });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OtController();

