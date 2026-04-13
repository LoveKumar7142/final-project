import express from "express";
import { rateLimiter } from "../../middleware/rateLimiter.js";
import {
  addProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  reorderProjects,
} from "../../controllers/projectController.js";

import { protect } from "../../middleware/authMiddleware.js";
import { isAdmin } from "../../middleware/adminMiddleware.js";
import { validateRequest } from "../../middleware/validationMiddleware.js";
import { projectSchema } from "../../schemas/projectSchema.js";

const router = express.Router();

// ✅ ID VALIDATION
const validateId = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  next();
};

// 🔹 CREATE PROJECT
router.post("/", rateLimiter, protect, isAdmin, validateRequest(projectSchema), addProject);

// 🔹 GET ALL PROJECTS (PUBLIC)
router.get("/", rateLimiter, getProjects);

// 🔹 REORDER PROJECTS (ADMIN)
router.put("/reorder", rateLimiter, protect, isAdmin, (req, res, next) => {
  if (!Array.isArray(req.body.projectIds) || req.body.projectIds.length > 100) {
    return res.status(400).json({ message: "Invalid reorder data" });
  }
  next();
}, reorderProjects);

// 🔹 GET PROJECT BY ID OR SLUG (PUBLIC)
router.get("/:id", rateLimiter, getProjectById);

// 🔹 UPDATE PROJECT
router.put("/:id", rateLimiter, protect, isAdmin, validateId, validateRequest(projectSchema), updateProject);

// 🔹 DELETE PROJECT
router.delete("/:id", rateLimiter, protect, isAdmin, validateId, deleteProject);

export default router;
