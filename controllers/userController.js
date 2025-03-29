import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModel.js";
import sendEmail from "../utils/emailService.js";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Register User
const registerUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({ 
      first_name, 
      last_name, 
      email, 
      password,
      display_name: `${first_name} ${last_name}`.trim(),
      emailVerificationToken,
      emailVerificationTokenExpire,
      isEmailVerified: false
    });
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${emailVerificationToken}`;
    const message = `Please verify your email by clicking on the following link: ${verificationUrl}`;
    const htmlMessage = `
      <h1>Email Verification</h1>
      <p>Thank you for registering!</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}" target="_blank">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `;
    
    await sendEmail(user.email, "Email Verification", message, htmlMessage);
    
    res.status(201).json({
      success: true,
      user: { 
        id: user._id, 
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token: generateToken(user._id),
      message: "Registration successful. Please check your email to verify your account."
    });
  } catch (error) {
    next(error);
  }
};

// Login User
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        success: false, 
        message: "Please verify your email before logging in",
        isEmailVerified: false
      });
    }

    res.json({
      success: true,
      user: { 
        id: user._id, 
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// Get User Profile (Protected)
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resetToken -resetTokenExpire");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Forgot Password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate reset token (6-digit code)
    const resetToken = crypto.randomInt(100000, 999999).toString();
    
    // Set token expiration (1 hour from now)
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset token to user's email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please use the following code to reset your password: ${resetToken}`;
    const htmlMessage = `
      <h1>Password Reset</h1>
      <p>You requested a password reset.</p>
      <p>Your password reset code is: <strong>${resetToken}</strong></p>
      <p>Or click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>This code will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;
    
    await sendEmail(user.email, "Password Reset", message, htmlMessage);

    res.json({ 
      success: true, 
      message: "Password reset instructions sent to your email" 
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Find user with the token and check if token is still valid
    const user = await User.findOne({
      resetToken,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }

    // Set new password and clear reset token fields
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    // Send confirmation email
    const message = "Your password has been successfully reset.";
    await sendEmail(user.email, "Password Reset Successful", message);

    res.json({ 
      success: true, 
      message: "Password reset successful" 
    });
  } catch (error) {
    next(error);
  }
};

// Verify Email
const verifyEmail = async (req, res, next) => {
  try {
    const { emailVerificationToken } = req.params;

    // Find user with the token and check if token is still valid
    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired verification token" 
      });
    }

    // Set email as verified and clear verification token fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: "Email verification successful" 
    });
  } catch (error) {
    next(error);
  }
};

export { registerUser, loginUser, getUserProfile, forgotPassword, resetPassword, verifyEmail };