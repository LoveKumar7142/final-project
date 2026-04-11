import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { lazyRoute } from "../utils/lazyRoute.js";

const router = express.Router();
const loadAuthController = () => import("../controllers/authController.js");

router.post("/register", lazyRoute(loadAuthController, "registerUser"));
router.post("/register/resend-otp", lazyRoute(loadAuthController, "resendRegistrationOtp"));
router.post("/register/verify-otp", lazyRoute(loadAuthController, "verifyRegistrationOtp"));
router.post("/login", lazyRoute(loadAuthController, "loginUser"));
router.post("/firebase", lazyRoute(loadAuthController, "firebaseLogin"));
router.get("/me", protect, lazyRoute(loadAuthController, "getCurrentUser"));
router.post("/forgot-password", lazyRoute(loadAuthController, "forgotPassword"));
router.post("/reset-password", lazyRoute(loadAuthController, "resetPassword"));

export default router;

