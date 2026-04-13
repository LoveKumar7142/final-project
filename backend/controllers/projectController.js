import pool from "../config/db.js";
import {
  assertValidProjectPayload,
  parseJsonArrayInput,
  toBoolean,
  toNullableString,
  toTrimmedString,
} from "../utils/validation.js";
import { createUploadError } from "../middleware/uploadMiddleware.js";
import { destroyCloudinaryAsset } from "../utils/cloudinaryAssets.js";

const sendDebugError = (res, error, fallbackMessage = "Internal server error") => {
  console.error("PROJECT ERROR:", error);

  const payload = {
    message: error?.message || fallbackMessage,
    details: error?.details || undefined,
  };

  if (process.env.NODE_ENV !== "production") {
    payload.debug = {
      name: error?.name,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      sqlState: error?.sqlState,
      stack: error?.stack,
    };
  }

  return res.status(error?.statusCode || 500).json(payload);
};

const normalizeProject = (project) => ({
  id: project.id,
  slug: project.slug,
  title: project.title,
  tagline: project.tagline,
  description: project.description,
  long_description: project.long_description,
  tech: parseJsonArrayInput(project.tech),
  gallery: parseJsonArrayInput(project.gallery),
  price: project.price,
  demo_url: project.demo_url,
  category: project.category,
  is_featured: project.is_featured,
  is_paid: project.is_paid,
  download_count: project.download_count,
  created_at: project.created_at,
});

const mapProjectPayload = (payload) => {
  const imageUrl = toNullableString(payload.image_url ?? payload.hero_image);
  const imagePublicId = toNullableString(
    payload.image_public_id ?? payload.hero_image_public_id,
  );

  const tech = parseJsonArrayInput(payload.tech);
  const gallery = parseJsonArrayInput(payload.gallery);

  // ✅ SAFE PRICE VALIDATION
  const price = Number(payload.price ?? 0);

  if (!Number.isInteger(price) || price < 0 || price > 10000000) {
    throw createUploadError("Invalid price");
  }

  // ✅ URL VALIDATION
  const demoUrl = toNullableString(payload.demo_url);

  if (demoUrl && !/^https?:\/\/.+/.test(demoUrl)) {
    throw createUploadError("Invalid demo URL");
  }

  const fileUrl = toNullableString(payload.file);

  if (fileUrl && !/^https?:\/\/.+/.test(fileUrl)) {
    throw createUploadError("Invalid file URL");
  }

  // ✅ FINAL OBJECT
  const project = {
    slug: toTrimmedString(payload.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-"),

    title: toTrimmedString(payload.title),
    tagline: toNullableString(payload.tagline),
    description: toNullableString(payload.description),
    long_description: toNullableString(payload.long_description),

    tech,
    gallery,

    price: price,

    file: fileUrl,
    file_name: toNullableString(payload.file_name),
    file_public_id: toNullableString(payload.file_public_id),

    demo_url: demoUrl,

    hero_image: imageUrl,
    hero_image_public_id: imagePublicId,
    image_url: imageUrl,
    image_public_id: imagePublicId,

    category: payload.category === "Free" ? "Free" : "Paid",

    is_featured: toBoolean(payload.is_featured),
    is_paid: toBoolean(payload.is_paid),

    sort_order: Number(payload.sort_order) || 0,
  };

  assertValidProjectPayload(project);
  return {
    ...project,
    tech: JSON.stringify(tech),
    gallery: JSON.stringify(gallery),
  };
};

const fetchProjectById = async (id) => {
  const [projects] = await pool.query(
    "SELECT * FROM projects WHERE id = ? LIMIT 1",
    [id],
  );
  return projects[0] || null;
};

const cleanupProjectAssets = async (project) => {
  await Promise.all([
    destroyCloudinaryAsset(project.hero_image_public_id, "image"),
    destroyCloudinaryAsset(project.image_public_id, "image"),
    destroyCloudinaryAsset(project.file_public_id, "raw"),
  ]);
};

export const addProject = async (req, res) => {
  try {
    const project = mapProjectPayload(req.body);

    const [existingProjects] = await pool.query(
      "SELECT id FROM projects WHERE slug = ? LIMIT 1",
      [project.slug],
    );

    if (existingProjects.length > 0) {
      return res
        .status(400)
        .json({ message: "A project with this slug already exists" });
    }

    const [result] = await pool.query(
      `INSERT INTO projects
      (slug, title, tagline, description, long_description, tech, gallery, price, file, file_name, file_public_id, demo_url, hero_image, hero_image_public_id, image_url, image_public_id, category, is_featured, is_paid, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project.slug,
        project.title,
        project.tagline,
        project.description,
        project.long_description,
        project.tech,
        project.gallery,
        project.price,
        project.file,
        project.file_name,
        project.file_public_id,
        project.demo_url,
        project.hero_image,
        project.hero_image_public_id,
        project.image_url,
        project.image_public_id,
        project.category,
        project.is_featured,
        project.is_paid,
        project.sort_order,
      ],
    );

    const createdProject = await fetchProjectById(result.insertId);

    res.status(201).json({
      message: "Project added successfully",
      project: createdProject ? normalizeProject(createdProject) : null,
    });
  } catch (error) {
    return sendDebugError(res, error);
  }
};

export const getProjects = async (req, res) => {
  try {
    const [projects] = await pool.query(
      "SELECT * FROM projects ORDER BY sort_order ASC, id DESC",
    );
    res.json(projects.map(normalizeProject));
  } catch (error) {
    return sendDebugError(res, error);
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const safeId = Number(id);
    const isNumericId = Number.isInteger(safeId) && safeId > 0;

    const [projects] = await pool.query(
      "SELECT * FROM projects WHERE id = ? OR slug = ? LIMIT 1",
      [isNumericId ? safeId : 0, id],
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(normalizeProject(projects[0]));
  } catch (error) {
    return sendDebugError(res, error);
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProject = await fetchProjectById(id);

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = mapProjectPayload({ ...existingProject, ...req.body });

    // ðŸš€ Auto-detect manual URL changes and detach Cloudinary public IDs so old files get hard-deleted
    if (project.image_url !== existingProject.image_url) {
      project.image_public_id = null;
      project.hero_image_public_id = null;
    }

    if (project.file !== existingProject.file) {
      project.file_public_id = null;
    }

    const [slugConflict] = await pool.query(
      "SELECT id FROM projects WHERE slug = ? AND id <> ? LIMIT 1",
      [project.slug, id],
    );

    if (slugConflict.length > 0) {
      return res
        .status(400)
        .json({ message: "Another project already uses this slug" });
    }

    await pool.query(
      `UPDATE projects
       SET slug = ?, title = ?, tagline = ?, description = ?, long_description = ?, tech = ?, gallery = ?, price = ?, file = ?, file_name = ?, file_public_id = ?, demo_url = ?, hero_image = ?, hero_image_public_id = ?, image_url = ?, image_public_id = ?, category = ?, is_featured = ?, is_paid = ?, sort_order = ?
       WHERE id = ?`,
      [
        project.slug,
        project.title,
        project.tagline,
        project.description,
        project.long_description,
        project.tech,
        project.gallery,
        project.price,
        project.file,
        project.file_name,
        project.file_public_id,
        project.demo_url,
        project.hero_image,
        project.hero_image_public_id,
        project.image_url,
        project.image_public_id,
        project.category,
        project.is_featured,
        project.is_paid,
        project.sort_order,
        id,
      ],
    );

    const staleImageIds = [
      existingProject.hero_image_public_id,
      existingProject.image_public_id,
    ].filter(Boolean);
    for (const publicId of staleImageIds) {
      if (
        publicId !== project.hero_image_public_id &&
        publicId !== project.image_public_id
      ) {
        await destroyCloudinaryAsset(publicId, "image");
      }
    }

    if (
      existingProject.file_public_id &&
      existingProject.file_public_id !== project.file_public_id
    ) {
      await destroyCloudinaryAsset(existingProject.file_public_id, "raw");
    }

    const updatedProject = await fetchProjectById(id);

    res.json({
      message: "Project updated successfully",
      project: updatedProject ? normalizeProject(updatedProject) : null,
    });
  } catch (error) {
    return sendDebugError(res, error);
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProject = await fetchProjectById(id);

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    await pool.query("DELETE FROM projects WHERE id = ?", [id]);
    await cleanupProjectAssets(existingProject);

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    return sendDebugError(res, error);
  }
};

export const reorderProjects = async (req, res) => {
  try {
    const { projectIds } = req.body;
    if (!projectIds || !Array.isArray(projectIds)) {
      return res.status(400).json({ message: "Invalid project array" });
    }

    if (projectIds.length > 100) {
      return res.status(400).json({ message: "Too many items" });
    }

    for (let i = 0; i < projectIds.length; i++) {
      const id = Number(projectIds[i]);
      if (!Number.isInteger(id)) continue;

      await pool.query("UPDATE projects SET sort_order = ? WHERE id = ?", [
        i,
        id,
      ]);
    }
    res.json({ message: "Projects reordered successfully" });
  } catch (error) {
    return sendDebugError(res, error);
  }
};
