import express from "express";
import {
  generateDownloadUrl,
  serveProxyDownload,
} from "../controllers/downloadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 Generate download link (auth required)
router.post("/:projectId/generate", protect, generateDownloadUrl);

// 🔐 Serve download (auth + token required)
router.get("/serve", protect, serveProxyDownload);

export default router;
