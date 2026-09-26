// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');

router.get('/register', redirectIfAuthenticated, authController.showRegister);
router.post('/register', redirectIfAuthenticated, authController.register);
router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', redirectIfAuthenticated, authController.login);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;
