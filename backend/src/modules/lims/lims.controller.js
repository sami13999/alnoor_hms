const limsService = require('./lims.service');

class LimsController {
  async getTests(req, res) {
    try {
      const tests = await limsService.getLabTests();
      return res.json({ success: true, data: tests });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrders(req, res) {
    try {
      const { status } = req.query;
      const orders = await limsService.getLabOrders(status);
      return res.json({ success: true, data: orders });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrder(req, res) {
    try {
      const order = await limsService.getOrderDetails(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.json({ success: true, data: order });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createOrder(req, res) {
    try {
      const { patientId, testId } = req.body;
      const doctorId = req.user?.user_id;
      const order = await limsService.createLabOrder({ patientId, testId, doctorId });
      return res.status(201).json({ success: true, data: order });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async simulateAnalyzer(req, res) {
    try {
      const result = await limsService.simulateAnalyzerCapture(req.params.id);
      return res.json({
        success: true,
        message: 'Serial Analyzer data successfully acquired and parsed',
        data: result
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifyOrder(req, res) {
    try {
      const pathologistId = req.user?.user_id;
      const result = await limsService.verifyOrder(req.params.id, pathologistId);
      return res.json({
        success: true,
        message: 'Diagnostic report signed off by Pathologist with QR verification seal',
        data: result
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new LimsController();

