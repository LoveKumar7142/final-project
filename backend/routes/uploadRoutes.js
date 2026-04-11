import express from "express";
import uploadAny, { uploadArchive, uploadImage } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { lazyRoute } from "../utils/lazyRoute.js";

const router = express.Router();
const loadUploadController = () => import("../controllers/uploadController.js");
const loadMediaController = () => import("../controllers/mediaController.js");

router.post("/profile/hero-image", protect, isAdmin, uploadImage.single("file"), lazyRoute(loadMediaController, "uploadProfileHeroImage"));
router.post("/projects/:id/hero-image", protect, isAdmin, uploadImage.single("file"), lazyRoute(loadMediaController, "uploadProjectHeroImage"));
router.post("/projects/:id/archive", protect, isAdmin, uploadArchive.single("file"), lazyRoute(loadMediaController, "uploadProjectArchive"));
router.post("/site-assets/:assetKey", protect, isAdmin, uploadImage.single("file"), lazyRoute(loadMediaController, "uploadSiteAsset"));
router.post("/", protect, uploadAny.single("file"), lazyRoute(loadUploadController, "uploadFile"));

export default router;
