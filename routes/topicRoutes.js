// routes/topicRoutes.js
const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

// Mounted at /books/:bookId/topics
const nested = express.Router({ mergeParams: true });
nested.post('/', topicController.create);

// Mounted at /topics
router.get('/:id', topicController.showTopic);
router.post('/:id/rename', topicController.rename);
router.post('/:id/delete', topicController.delete);
router.post('/:id/chat', topicController.sendMessage);
router.get('/:id/subheadings', topicController.subheadings);

module.exports = { router, nested };
