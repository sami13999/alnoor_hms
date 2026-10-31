const ipdService = require('./ipd.service');

class IpdController {
  async getWardsAndBeds(req, res) {
    try {
      const wards = await ipdService.getWardsAndBeds();
      return res.json({ success: true, data: wards });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateBedStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await ipdService.updateBedStatus(id, status);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async admitPatient(req, res) {
    try {
      const { patientId, bedId, attendingDoctorId } = req.body;
      const docId = attendingDoctorId || req.user?.user_id;
      const result = await ipdService.admitPatient({ patientId, bedId, attendingDoctorId: docId });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getActiveAdmissions(req, res) {
    try {
      const admissions = await ipdService.getActiveAdmissions();
      return res.json({ success: true, data: admissions });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async dischargePatient(req, res) {
    try {
      const result = await ipdService.dischargePatient(req.params.id);
      return res.json({ success: true, message: 'Patient discharged and bed marked DIRTY for cleaning', data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getWristband(req, res) {
    try {
      const data = await ipdService.getWristbandPrintData(req.params.admissionId);
      if (!data) return res.status(404).json({ success: false, message: 'Admission record not found' });
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new IpdController();

