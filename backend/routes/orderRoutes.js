import express from "express";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { lazyRoute } from "../utils/lazyRoute.js";

const router = express.Router();
const loadOrderController = () => import("../controllers/orderController.js");

router.post(
  "/create",
  rateLimiter,
  lazyRoute(loadOrderController, "createHireOrder"),
);
router.post(
  "/verify",
  rateLimiter,
  lazyRoute(loadOrderController, "verifyHirePayment"),
);

export default router;
