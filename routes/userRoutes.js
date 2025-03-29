import express from "express";
import { registerUser, loginUser, getUserProfile, forgotPassword, resetPassword, verifyEmail } from "../controllers/userController.js";
import { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } from "../middlewares/validationMiddleware.js";
import protect from "../middlewares/authentication.js";
import loginLimiter from "../middlewares/rateLimit.js";

const router = express.Router();

router.post("/register", registerValidation, registerUser);
router.post("/login", loginLimiter, loginValidation, loginUser);
router.get("/profile", protect, getUserProfile);
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);
router.get("/verify-email/:emailVerificationToken", verifyEmail);

export default router;
