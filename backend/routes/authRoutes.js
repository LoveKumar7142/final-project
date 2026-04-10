import express from "express";
import {
  firebaseLogin,
  forgotPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  resendRegistrationOtp,
  resetPassword,
  verifyRegistrationOtp,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/register/resend-otp", resendRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/login", loginUser);
router.post("/firebase", firebaseLogin);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

