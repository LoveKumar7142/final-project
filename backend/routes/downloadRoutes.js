import express from "express";
import { downloadProject } from "../controllers/downloadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:projectId", protect, downloadProject);

export default router;
