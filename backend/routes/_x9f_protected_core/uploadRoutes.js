import express from "express";
import { rateLimiter } from "../../middleware/rateLimiter.js";
import uploadAny, {
  uploadArchive,
  uploadImage,
} from "../../middleware/uploadMiddleware.js";
import { protect } from "../../middleware/authMiddleware.js";
import { isAdmin } from "../../middleware/adminMiddleware.js";
import { lazyRoute } from "../../utils/lazyRoute.js";

const router = express.Router();

const loadUploadController = () => import("../../controllers/uploadController.js");
const loadMediaController = () => import("../../controllers/mediaController.js");

// ✅ ID VALIDATION (for :id routes)
const validateId = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  next();
};

// ✅ ASSET KEY VALIDATION
const validateAssetKey = (req, res, next) => {
  const key = req.params.assetKey;

  if (!/^[a-zA-Z0-9-_]+$/.test(key)) {
    return res.status(400).json({ message: "Invalid asset key" });
  }

  next();
};

// 🔹 PROFILE HERO IMAGE
router.post(
  "/profile/hero-image",
  rateLimiter,
  protect,
  isAdmin,
  uploadImage.single("file"),
  lazyRoute(loadMediaController, "uploadProfileHeroImage"),
);

router.delete(
  "/profile/hero-image",
  rateLimiter,
  protect,
  isAdmin,
  lazyRoute(loadMediaController, "deleteProfileHeroImage")
);

// 🔹 PROJECT HERO IMAGE
router.post(
  "/projects/:id/hero-image",
  rateLimiter,
  protect,
  isAdmin,
  validateId,
  uploadImage.single("file"),
  lazyRoute(loadMediaController, "uploadProjectHeroImage"),
);

// 🔹 PROJECT ARCHIVE
router.post(
  "/projects/:id/archive",
  rateLimiter,
  protect,
  isAdmin,
  validateId,
  uploadArchive.single("file"),
  lazyRoute(loadMediaController, "uploadProjectArchive"),
);

// 🔹 SITE ASSET UPLOAD
router.post(
  "/site-assets/:assetKey",
  rateLimiter,
  protect,
  isAdmin,
  validateAssetKey,
  uploadImage.single("file"),
  lazyRoute(loadMediaController, "uploadSiteAsset"),
);

// 🔹 SITE ASSET DELETE
router.delete(
  "/site-assets/:assetKey",
  rateLimiter,
  protect,
  isAdmin,
  validateAssetKey,
  lazyRoute(loadMediaController, "deleteSiteAsset"),
);

// 🔹 GENERIC UPLOAD (STRICT)
router.post(
  "/",
  rateLimiter,
  protect,
  isAdmin,
  uploadAny.single("file"),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }
    next();
  },
  lazyRoute(loadUploadController, "uploadFile"),
);

export default router;
