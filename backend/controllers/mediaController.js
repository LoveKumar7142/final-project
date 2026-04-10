import { uploadBufferToCloudinary, destroyCloudinaryAsset, formatUploadResponse } from "../utils/cloudinaryAssets.js";
import pool from "../config/db.js";

export const uploadProfileHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const [profiles] = await pool.query(
      "SELECT id, hero_image_public_id FROM portfolio_profile ORDER BY id ASC LIMIT 1",
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: "Portfolio profile not found" });
    }

    const profile = profiles[0];
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "portfolio/profile",
      public_id: "love-kumar-hero",
      overwrite: true,
      resource_type: "image",
    });

    await pool.query(
      "UPDATE portfolio_profile SET hero_image = ?, hero_image_public_id = ? WHERE id = ?",
      [result.secure_url, result.public_id, profile.id],
    );

    if (profile.hero_image_public_id && profile.hero_image_public_id !== result.public_id) {
      await destroyCloudinaryAsset(profile.hero_image_public_id, "image");
    }

    const [updatedProfiles] = await pool.query(
      "SELECT * FROM portfolio_profile WHERE id = ? LIMIT 1",
      [profile.id],
    );

    res.json({
      message: "Profile hero image uploaded and saved successfully",
      upload: formatUploadResponse(result),
      profile: updatedProfiles[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadProjectHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { id } = req.params;
    const [projects] = await pool.query(
      "SELECT id, slug, hero_image_public_id, image_public_id FROM projects WHERE id = ? OR slug = ? LIMIT 1",
      [id, id],
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = projects[0];
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "portfolio/projects",
      public_id: `${project.slug || `project-${project.id}`}-hero`,
      overwrite: true,
      resource_type: "image",
    });

    await pool.query(
      "UPDATE projects SET hero_image = ?, hero_image_public_id = ?, image_url = ?, image_public_id = ? WHERE id = ?",
      [result.secure_url, result.public_id, result.secure_url, result.public_id, project.id],
    );

    const previousPublicIds = [project.hero_image_public_id, project.image_public_id].filter(Boolean);
    for (const publicId of previousPublicIds) {
      if (publicId !== result.public_id) {
        await destroyCloudinaryAsset(publicId, "image");
      }
    }

    const [updatedProjects] = await pool.query(
      "SELECT * FROM projects WHERE id = ? LIMIT 1",
      [project.id],
    );

    res.json({
      message: "Project image uploaded and saved successfully",
      upload: formatUploadResponse(result),
      project: updatedProjects[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadProjectArchive = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { id } = req.params;
    const [projects] = await pool.query(
      "SELECT id, slug, file_public_id FROM projects WHERE id = ? OR slug = ? LIMIT 1",
      [id, id],
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = projects[0];
    const safeOriginalName = req.file.originalname?.replace(/\s+/g, "-") || `${project.slug || project.id}.zip`;
    const publicId = `${project.slug || `project-${project.id}`}-archive`;

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "portfolio/downloads",
      public_id: publicId,
      overwrite: true,
      resource_type: "raw",
      format: safeOriginalName.split(".").pop(),
    });

    await pool.query(
      "UPDATE projects SET file = ?, file_name = ?, file_public_id = ? WHERE id = ?",
      [result.secure_url, req.file.originalname, result.public_id, project.id],
    );

    if (project.file_public_id && project.file_public_id !== result.public_id) {
      await destroyCloudinaryAsset(project.file_public_id, "raw");
    }

    const [updatedProjects] = await pool.query(
      "SELECT * FROM projects WHERE id = ? LIMIT 1",
      [project.id],
    );

    res.json({
      message: "Project archive uploaded and saved successfully",
      upload: formatUploadResponse(result),
      project: updatedProjects[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadSiteAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { assetKey } = req.params;
    const normalizedKey = String(assetKey || "").trim().toLowerCase();

    if (!normalizedKey) {
      return res.status(400).json({ message: "Asset key is required" });
    }

    const [existingAssets] = await pool.query(
      "SELECT * FROM site_assets WHERE asset_key = ? LIMIT 1",
      [normalizedKey],
    );

    const currentAsset = existingAssets[0] || null;
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "portfolio/site-assets",
      public_id: normalizedKey,
      overwrite: true,
      resource_type: "image",
    });

    if (currentAsset) {
      await pool.query(
        "UPDATE site_assets SET asset_url = ?, asset_public_id = ? WHERE id = ?",
        [result.secure_url, result.public_id, currentAsset.id],
      );
    } else {
      await pool.query(
        "INSERT INTO site_assets (asset_key, label, asset_url, asset_public_id, sort_order) VALUES (?, ?, ?, ?, ?)",
        [normalizedKey, normalizedKey, result.secure_url, result.public_id, 999],
      );
    }

    if (currentAsset?.asset_public_id && currentAsset.asset_public_id !== result.public_id) {
      await destroyCloudinaryAsset(currentAsset.asset_public_id, "image");
    }

    const [updatedAssets] = await pool.query(
      "SELECT * FROM site_assets WHERE asset_key = ? LIMIT 1",
      [normalizedKey],
    );

    res.json({
      message: "Site image uploaded successfully",
      upload: formatUploadResponse(result),
      asset: updatedAssets[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
