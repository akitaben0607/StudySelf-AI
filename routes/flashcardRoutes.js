// routes/flashcardRoutes.js
const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcardController');

// Mounted at /books/:bookId/flashcards
const nested = express.Router({ mergeParams: true });
nested.get('/', flashcardController.setup);
nested.post('/generate', flashcardController.generate);
nested.get('/study', flashcardController.study);

// Mounted at /flashcards
router.post('/:id/rate', flashcardController.rate);

module.exports = { router, nested };
