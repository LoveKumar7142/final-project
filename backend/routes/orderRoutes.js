import express from "express";
import {
  createHireOrder,
  verifyHirePayment,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/create", createHireOrder);
router.post("/verify", verifyHirePayment);

export default router;
