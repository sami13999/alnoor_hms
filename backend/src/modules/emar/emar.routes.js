const express = require('express');
const router = express.Router();
const emarController = require('./emar.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/scheduled', (req, res) => emarController.getScheduled(req, res));
router.post('/validate-administer', (req, res) => emarController.validateAndAdminister(req, res));
router.get('/recent', (req, res) => emarController.getRecent(req, res));
router.get('/temperatures', (req, res) => emarController.getTemperatureLogs(req, res));
router.post('/temperatures', (req, res) => emarController.logTemperature(req, res));

module.exports = router;

