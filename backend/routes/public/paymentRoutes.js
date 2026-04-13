import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";
import { lazyRoute } from "../../utils/lazyRoute.js";

const router = express.Router();
const loadPaymentController = () =>
  import("../../controllers/paymentController.js");

router.post(
  "/create-order",
  rateLimiter,
  protect,
  lazyRoute(loadPaymentController, "createOrder"),
);
router.post(
  "/verify",
  rateLimiter,
  protect,
  lazyRoute(loadPaymentController, "verifyPayment"),
);

export default router;
