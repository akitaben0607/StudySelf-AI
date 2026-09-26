// routes/miscRoutes.js
const express = require('express');
const router = express.Router();
const revisionController = require('../controllers/revisionController');
const progressController = require('../controllers/progressController');
const searchController = require('../controllers/searchController');

router.get('/revision', revisionController.list);
router.post('/revision/:id/revised', revisionController.markRevised);

router.get('/progress', progressController.show);

router.get('/search', searchController.search);

module.exports = router;
