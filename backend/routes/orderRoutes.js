import express from "express";
import { lazyRoute } from "../utils/lazyRoute.js";

const router = express.Router();
const loadOrderController = () => import("../controllers/orderController.js");

router.post("/create", lazyRoute(loadOrderController, "createHireOrder"));
router.post("/verify", lazyRoute(loadOrderController, "verifyHirePayment"));

export default router;
