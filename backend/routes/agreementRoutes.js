import express from "express";
import { acceptAgreement } from "../controllers/agreementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, acceptAgreement);

export default router;
