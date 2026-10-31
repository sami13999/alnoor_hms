const billingService = require('./billing.service');

class BillingController {
  async getInvoices(req, res) {
    try {
      const { status, search } = req.query;
      const invoices = await billingService.getInvoices({ status, search });
      return res.json({ success: true, data: invoices });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getInvoice(req, res) {
    try {
      const invoice = await billingService.getInvoiceDetails(req.params.id);
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
      return res.json({ success: true, data: invoice });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async consolidate(req, res) {
    try {
      const { patientId, admissionId, discountAmount } = req.body;
      const cashierId = req.user?.user_id;
      const invoice = await billingService.consolidateInvoice({
        patientId,
        admissionId,
        cashierId,
        discountAmount
      });
      return res.status(201).json({ success: true, message: 'Consolidated invoice generated', data: invoice });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async settle(req, res) {
    try {
      const { paidAmount } = req.body;
      const cashierId = req.user?.user_id;
      const invoice = await billingService.settleInvoice(req.params.id, paidAmount, cashierId);
      return res.json({ success: true, message: 'Payment recorded', data: invoice });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCurrentShiftDrawer(req, res) {
    try {
      const cashierId = req.user?.user_id;
      const drawer = await billingService.getCurrentShiftDrawer(cashierId);
      return res.json({ success: true, data: drawer });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async openShiftDrawer(req, res) {
    try {
      const { department, openingBalance } = req.body;
      const cashierId = req.user?.user_id;
      const drawer = await billingService.openShiftDrawer({ cashierId, department, openingBalance });
      return res.status(201).json({ success: true, message: 'Shift cash drawer opened', data: drawer });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async closeShiftDrawer(req, res) {
    try {
      const { shiftId, physicalCountedCash, notes } = req.body;
      const result = await billingService.closeShiftDrawer({ shiftId, physicalCountedCash, notes });
      return res.json({ success: true, message: 'Shift drawer closed and balanced', ...result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getRecentShiftDrawers(req, res) {
    try {
      const drawers = await billingService.getRecentShiftDrawers();
      return res.json({ success: true, data: drawers });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new BillingController();

