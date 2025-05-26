const { sendOTPEmail, checkIfUserExist, sendOTPMobile } = require("../services/userService");
const supabase = require("../supabaseClient");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const SignUp = async (req, res) => {
  const { email, password, role, phone } = req.body;
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return res.status(400).json({ error: signUpError.message });
  }

  const userId = signUpData.user.id;

  const infoUpdate = await supabase.auth.admin.updateUserById(userId, {
    phone: phone,
    user_metadata: {
      role: role,
    },
  });

  if (!infoUpdate) {
    return res
      .status(400)
      .json({ message: infoUpdate.error });
  }

  res.status(200).json({
    message: "Sucessfully! User signed up and role saved",
    user: {
      id: userId,
      email,
      role,
    },
  });
};

const Login = async (req, res) => {
  const { email, password } = req.body;

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

  if (signInError || !signInData.user) {
    res.status(400).json({ error: "Invalid Credentials" });
  }

  const userId = signInData.user.id;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId);

  if (profileError) {
    res.status(400).json({ error: profileError.message });
  }

  const token = jwt.sign(
    {
      id: userId,
      email,
      role: profileData.role,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1hr" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 1000, // 1 hour
    sameSite: "strict",
    secure: process.env.NODE_ENV,
  });

  res.status(200).json({
    message: "Login Sucessfully",
    user: {
      id: userId,
      email,
      role: profileData.role,
    },
  });
};

const Logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out Sucessfully" });
};

const sendOtpToEmailOrPhone = async (req, res) => {
  try {
    const { email, phone } = req.body;

    console.log(email, phone, "  <-request")
    const userId = await checkIfUserExist(email, phone);
    

    if (!userId) {
      res
        .status(404)
        .json({ message: "User not found. Please register first." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 1 * 60 * 1000).toISOString();

    let otpSent = false
    if(email){
     otpSent = await sendOTPEmail(email, otp);
    } else if(phone){
      otpSent = await sendOTPMobile(phone, otp);
    }

    if (!otpSent) {
      res.status(500).json({ message: "Failed to send otp, Please try again" });
    }

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        temp_otp: otp,
        otp_expiry_date: otpExpiry,
      },
    });

    if(email){
    res.status(200).json({
      sucess: true,
      message: "OTP successfully sent to your email.",
    });
  } else if(phone){
    res.status(200).json({
      sucess:true, 
      message:"OTP successfully sent to your Mobile Number."
    })
  }
  } catch (e) {
    console.log(e);
  }
};

const otpVerification = async (req, res) => {
  const { email, otp } = req.body;

  const userId = await checkIfUserExist(email);

  if (!userId) return res.status(404).json({ message: "User not found" });

  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) console.error(error, "Interal server error, try again");

  const { temp_otp, otp_expiry_date } = data.user.user_metadata;

  console.log(temp_otp);

  if (!temp_otp || temp_otp.toString() !== otp.toString()) {
    res
      .status(500)
      .json({ message: "Wrong Otp or Otp Expired, Please Enter Correct One" });
  }

  const isExpired = new Date(otp_expiry_date) < new Date();
  if (isExpired) {
    return res
      .status(400)
      .json({ message: "OTP Expired, Please Resend the Otp" });
  }

  const reset_token = crypto.randomBytes(32).toString("hex");
  const reset_token_expiry = new Date(Date.now() + 2 * 60 * 1000).toISOString();

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      temp_otp: null,
      otp_expiry_date: null,
      password_reset_token: reset_token,
      password_reset_token_expiry: reset_token_expiry,
    },
  });

  res.status(200).json({
    sucess: true,
    message: "OTP Verify Sucessfully",
    reset_token: reset_token,
  });
};

const resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;

  const userId = await checkIfUserExist(email);
  if (!userId) return res.status(404).json({ message: "User not found" });

  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) console.error(error, "Interal server error, try again");

  const { password_reset_token, password_reset_token_expiry } =
    data.user.user_metadata;

  console.log(password_reset_token, "pass reset token");
  console.log(token, "token");

  if (password_reset_token !== token) {
    return res.status(400).json({ message: "Time Expired, Enter Email Again" });
  }

  const isExpired = new Date(password_reset_token_expiry) < new Date();
  if (isExpired) {
    return res.status(400).json({ message: "Token Expired" });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      password: newPassword,
      user_metadata: {
        password_reset_token: null,
        password_reset_token_expiry: null,
      },
    }
  );

  if (updateError) {
    return res.status(500).json({ message: "Failed to reset password" });
  }

  return res.status(200).json({
    sucess: true,
    message: "Password reset sucessfully",
  });
};



module.exports = {
  SignUp,
  Login,
  Logout,
  sendOtpToEmailOrPhone,
  otpVerification,
  resetPassword,
};
