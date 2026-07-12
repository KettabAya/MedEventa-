const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

const { registerValidation, validate } = require('../middlewares/validators');

// POST register (with validation)
router.post('/register', registerValidation, validate, authController.register);

// POST login
router.post('/login', authController.login);

// forgot password
router.post('/forgot-password', authController.forgotPassword);

// reset password
router.post('/reset-password', authController.resetPassword);

// verify email (signup steps)
router.post('/send-code', authController.sendVerificationCode);
router.post('/verify-code', authController.verifyVerificationCode);

module.exports = router;
