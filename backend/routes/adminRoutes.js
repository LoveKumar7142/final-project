import express from "express";
import {
  deleteMessage,
  deleteOrder,
  getAdminContent,
  getAdminSummary,
  getMessages,
  getOrders,
  saveAdminContent,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, isAdmin);

router.get("/summary", getAdminSummary);
router.get("/orders", getOrders);
router.delete("/orders/:id", deleteOrder);
router.get("/messages", getMessages);
router.delete("/messages/:id", deleteMessage);
router.get("/content", getAdminContent);
router.put("/content", saveAdminContent);

export default router;

