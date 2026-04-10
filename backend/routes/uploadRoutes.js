import express from "express";
import uploadAny, { uploadArchive, uploadImage } from "../middleware/uploadMiddleware.js";
import { uploadFile } from "../controllers/uploadController.js";
import {
  uploadProfileHeroImage,
  uploadProjectArchive,
  uploadProjectHeroImage,
  uploadSiteAsset,
} from "../controllers/mediaController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/profile/hero-image", protect, isAdmin, uploadImage.single("file"), uploadProfileHeroImage);
router.post("/projects/:id/hero-image", protect, isAdmin, uploadImage.single("file"), uploadProjectHeroImage);
router.post("/projects/:id/archive", protect, isAdmin, uploadArchive.single("file"), uploadProjectArchive);
router.post("/site-assets/:assetKey", protect, isAdmin, uploadImage.single("file"), uploadSiteAsset);
router.post("/", protect, uploadAny.single("file"), uploadFile);

export default router;
