import express from "express";
import {
  addProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  reorderProjects,
} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, isAdmin, addProject);
router.get("/", getProjects);
router.put("/reorder", protect, isAdmin, reorderProjects);
router.get("/:id", getProjectById);
router.put("/:id", protect, isAdmin, updateProject);
router.delete("/:id", protect, isAdmin, deleteProject);

export default router;
