import express from "express";
import { saveMessage } from "../../controllers/contactController.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// 🔐 Secure contact route
router.post("/", rateLimiter, saveMessage);

export default router;