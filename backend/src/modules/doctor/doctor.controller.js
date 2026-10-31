const doctorService = require('./doctor.service');

class DoctorController {
  async getLiveQueue(req, res) {
    try {
      const doctorId = req.query.doctorId || req.user?.user_id;
      // If user is doctor/surgeon, filter to self or view all
      const queue = await doctorService.getLiveQueue(req.query.all === 'true' ? null : doctorId);
      return res.json({ success: true, data: queue });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await doctorService.updateAppointmentStatus(id, status);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getClinicalOrderSets(req, res) {
    try {
      const sets = await doctorService.getClinicalOrderSets();
      return res.json({ success: true, data: sets });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createPrescription(req, res) {
    try {
      const prescription = await doctorService.createPrescription({
        ...req.body,
        doctorId: req.user?.user_id || req.body.doctorId
      });
      return res.status(201).json({ success: true, data: prescription });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async logVerbalOrder(req, res) {
    try {
      const order = await doctorService.logVerbalOrder({
        ...req.body,
        receivedByNurseId: req.user?.user_id || req.body.receivedByNurseId
      });
      return res.status(201).json({ success: true, data: order });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async signVerbalOrder(req, res) {
    try {
      const order = await doctorService.signVerbalOrder(req.params.id, req.user?.user_id);
      return res.json({ success: true, message: 'Verbal order counter-signed successfully', data: order });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getVerbalOrders(req, res) {
    try {
      const orders = await doctorService.getVerbalOrders();
      return res.json({ success: true, data: orders });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DoctorController();

