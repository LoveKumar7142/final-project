import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { lazyRoute } from "../../utils/lazyRoute.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();
const loadAuthController = () => import("../../controllers/authController.js");

// 🔥 Public routes (rate limited)
router.post(
  "/register",
  rateLimiter,
  lazyRoute(loadAuthController, "registerUser"),
);
router.post(
  "/register/resend-otp",
  rateLimiter,
  lazyRoute(loadAuthController, "resendRegistrationOtp"),
);
router.post(
  "/register/verify-otp",
  rateLimiter,
  lazyRoute(loadAuthController, "verifyRegistrationOtp"),
);

router.post("/login", rateLimiter, lazyRoute(loadAuthController, "loginUser"));
router.post(
  "/firebase",
  rateLimiter,
  lazyRoute(loadAuthController, "firebaseLogin"),
);

router.post(
  "/forgot-password",
  rateLimiter,
  lazyRoute(loadAuthController, "forgotPassword"),
);
router.post(
  "/reset-password",
  rateLimiter,
  lazyRoute(loadAuthController, "resetPassword"),
);

// 🔐 Protected route
router.get("/me", protect, lazyRoute(loadAuthController, "getCurrentUser"));

export default router;
