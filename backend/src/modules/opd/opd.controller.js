const opdService = require('./opd.service');

class OpdController {
  async searchPatients(req, res) {
    try {
      const q = req.query.q || '';
      const patients = await opdService.searchPatients(q);
      return res.json({ success: true, data: patients });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPatient(req, res) {
    try {
      const patient = await opdService.getPatientById(req.params.id);
      if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
      return res.json({ success: true, data: patient });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async registerPatient(req, res) {
    try {
      const patient = await opdService.registerPatient(req.body);
      return res.status(201).json({ success: true, data: patient });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async generateToken(req, res) {
    try {
      const { patientId, doctorId } = req.body;
      if (!patientId || !doctorId) {
        return res.status(400).json({ success: false, message: 'patientId and doctorId are required' });
      }

      const slip = await opdService.generateToken({
        patientId,
        doctorId,
        cashierId: req.user?.user_id
      });
      return res.status(201).json({ success: true, data: slip });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async redAlertEmergency(req, res) {
    try {
      const result = await opdService.triggerRedAlertEmergency({
        ...req.body,
        nurseId: req.user?.user_id
      });
      return res.status(201).json({
        success: true,
        message: 'Red Alert Emergency Fast-Track Admission Created',
        data: result
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRecentAppointments(req, res) {
    try {
      const appts = await opdService.getRecentAppointments();
      return res.json({ success: true, data: appts });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OpdController();

