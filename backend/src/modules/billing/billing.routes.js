const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/invoices', (req, res) => billingController.getInvoices(req, res));
router.get('/invoices/:id', (req, res) => billingController.getInvoice(req, res));
router.post('/invoices/consolidate', (req, res) => billingController.consolidate(req, res));
router.post('/invoices/:id/settle', (req, res) => billingController.settle(req, res));

router.get('/shift-drawers/current', (req, res) => billingController.getCurrentShiftDrawer(req, res));
router.post('/shift-drawers/open', (req, res) => billingController.openShiftDrawer(req, res));
router.post('/shift-drawers/close', (req, res) => billingController.closeShiftDrawer(req, res));
router.get('/shift-drawers/recent', (req, res) => billingController.getRecentShiftDrawers(req, res));

module.exports = router;

