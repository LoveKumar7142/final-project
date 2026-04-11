import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { lazyRoute } from "../utils/lazyRoute.js";

const router = express.Router();
const loadPaymentController = () => import("../controllers/paymentController.js");

router.post("/create-order", protect, lazyRoute(loadPaymentController, "createOrder"));
router.post("/verify", protect, lazyRoute(loadPaymentController, "verifyPayment"));

export default router;
