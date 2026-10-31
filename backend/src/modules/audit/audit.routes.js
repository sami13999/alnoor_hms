const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/kphcc-msds', (req, res) => auditController.getKphccEvaluations(req, res));
router.post('/kphcc-msds', (req, res) => auditController.recordKphccEvaluation(req, res));
router.get('/fixed-assets', (req, res) => auditController.getFixedAssets(req, res));
router.post('/fixed-assets', (req, res) => auditController.saveFixedAsset(req, res));

module.exports = router;

