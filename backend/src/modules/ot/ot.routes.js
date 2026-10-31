const express = require('express');
const router = express.Router();
const otController = require('./ot.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/surgeries', (req, res) => otController.getSurgeries(req, res));
router.post('/surgeries', (req, res) => otController.scheduleSurgery(req, res));
router.put('/surgeries/:id/who-checklist', (req, res) => otController.updateWhoChecklist(req, res));
router.get('/surgeries/:id/counts', (req, res) => otController.getCounts(req, res));
router.post('/surgeries/:id/counts', (req, res) => otController.recordCount(req, res));
router.put('/surgeries/:id/notes', (req, res) => otController.saveNotes(req, res));

module.exports = router;

