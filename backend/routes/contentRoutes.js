import express from "express";
import { getAboutContent, getHomeContent, getSiteAssetsContent } from "../controllers/contentController.js";

const router = express.Router();

router.get("/home", getHomeContent);
router.get("/about", getAboutContent);
router.get("/site-assets", getSiteAssetsContent);

export default router;
