import express from "express";
import { acceptAgreement } from "../controllers/agreementController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validateAgreement } from "../middleware/validateAggrementMiddleware.js";

const router = express.Router();

// 🔥 Secure route
router.post(
  "/accept",
  rateLimiter,
  protect,
  validateAgreement,
  acceptAgreement,
);

export default router;
