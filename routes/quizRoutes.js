// routes/quizRoutes.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Mounted at /books/:bookId/quiz
const nested = express.Router({ mergeParams: true });
nested.get('/', quizController.showScopeChoice);
nested.get('/setup', quizController.showSetup);
nested.post('/', quizController.generate);

// Mounted at /quiz
router.get('/history', quizController.history);
router.get('/result/:attemptId', quizController.result);
router.get('/:id/take', quizController.take);
router.post('/:id/submit', quizController.submit);

module.exports = { router, nested };
