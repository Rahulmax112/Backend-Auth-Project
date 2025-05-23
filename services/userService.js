const jwt = require("jsonwebtoken");
const supabase = require("../supabaseClient");
require("dotenv").config();
const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Email Transporter Config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio Transporter Config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const auth_token = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, auth_token);

// send otp to mobile number
const sendOTPMobile = async (mobileNumber, otp) => {
  let msgOptions = {
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobileNumber,
    body: `Your OTP code is ${otp}. It will expire in 1 minutes. Do not share it with anyone.`
  };

  try {
    const message = await client.messages.create(msgOptions);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const sendOTPEmail = async (email, otp) => {
  try {
    const mailerOptions = {
      from: `"My App OTP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>OTP Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: blue;">${otp}</h1>
        <p>This OTP will expire in 2 minutes. Please do not share it with anyone.</p>
      `,
    };

    const info = await transporter.sendMail(mailerOptions);
    console.log("Email Sent: ", info.messageId);
    return true;
  } catch (e) {
    console.log("Failed to send OTP email: ", e);
    return false;
  }
};

const checkIfUserExist = async (email, phone) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    console.log(email, phone, "service")
    let user;
    if (email) {
      user = data.users.find((user) => user.email === email);
    } else if (phone) {
      user = data.users.find((user) => `+${user.phone}` === phone);
    }

    if (error) {
      console.error("Error Checking Email", error.message);
      return false;
    }

    const userId = user.id;

    return userId;
  } catch (e) {
    console.error("Email Not Found", e);
  }
};

module.exports = { checkIfUserExist, sendOTPEmail, sendOTPMobile };
