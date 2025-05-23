const express = require('express');
const { SignUp, Login, Logout, otpVerification, resetPassword, sendOtpToEmailOrPhone } = require('../Controllers/userController');

const router = express.Router();


router.post('/signup', SignUp)
router.post('/login', Login )
router.delete('/logout', Logout)

router.post('/send-otp', sendOtpToEmailOrPhone );
router.post('/verify-otp', otpVerification);
router.post('/reset-password', resetPassword)
module.exports = router;