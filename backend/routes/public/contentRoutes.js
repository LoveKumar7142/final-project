import express from "express";
import {
  getAboutContent,
  getHomeContent,
  getSiteAssetsContent,
  getLegalContent,
} from "../../controllers/contentController.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

router.get("/home", rateLimiter, getHomeContent);
router.get("/about", rateLimiter, getAboutContent);
router.get("/site-assets", rateLimiter, getSiteAssetsContent);
router.get("/legal", rateLimiter, getLegalContent);

export default router;
