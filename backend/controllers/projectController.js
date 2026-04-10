import pool from "../config/db.js";
import {
  assertValidProjectPayload,
  parseJsonArrayInput,
  toBoolean,
  toNullableString,
  toTrimmedString,
} from "../utils/validation.js";
import { destroyCloudinaryAsset } from "../utils/cloudinaryAssets.js";

const normalizeProject = (project) => ({
  ...project,
  tech: parseJsonArrayInput(project.tech),
  gallery: parseJsonArrayInput(project.gallery),
  image_url: project.image_url || project.hero_image || null,
  image_public_id: project.image_public_id || project.hero_image_public_id || null,
});

const mapProjectPayload = (payload) => {
  const imageUrl = toNullableString(payload.image_url ?? payload.hero_image);
  const imagePublicId = toNullableString(payload.image_public_id ?? payload.hero_image_public_id);
  const tech = parseJsonArrayInput(payload.tech);
  const gallery = parseJsonArrayInput(payload.gallery);

  const project = {
    slug: toTrimmedString(payload.slug).toLowerCase(),
    title: toTrimmedString(payload.title),
    tagline: toNullableString(payload.tagline),
    description: toNullableString(payload.description),
    long_description: toNullableString(payload.long_description),
    tech,
    gallery,
    price: Number(payload.price || 0),
    file: toNullableString(payload.file),
    file_name: toNullableString(payload.file_name),
    file_public_id: toNullableString(payload.file_public_id),
    demo_url: toNullableString(payload.demo_url),
    hero_image: imageUrl,
    hero_image_public_id: imagePublicId,
    image_url: imageUrl,
    image_public_id: imagePublicId,
    category: payload.category === "Free" ? "Free" : "Paid",
    is_featured: toBoolean(payload.is_featured),
    is_paid: toBoolean(payload.is_paid),
  };

  assertValidProjectPayload(project);
  return {
    ...project,
    tech: JSON.stringify(tech),
    gallery: JSON.stringify(gallery),
  };
};

const fetchProjectById = async (id) => {
  const [projects] = await pool.query("SELECT * FROM projects WHERE id = ? LIMIT 1", [id]);
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
      return res.status(400).json({ message: "A project with this slug already exists" });
    }

    const [result] = await pool.query(
      `INSERT INTO projects
      (slug, title, tagline, description, long_description, tech, gallery, price, file, file_name, file_public_id, demo_url, hero_image, hero_image_public_id, image_url, image_public_id, category, is_featured, is_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ],
    );

    const createdProject = await fetchProjectById(result.insertId);

    res.status(201).json({
      message: "Project added successfully",
      project: createdProject ? normalizeProject(createdProject) : null,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
      details: error.details || undefined,
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    const [projects] = await pool.query("SELECT * FROM projects ORDER BY id ASC");
    res.json(projects.map(normalizeProject));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const [projects] = await pool.query(
      "SELECT * FROM projects WHERE id = ? OR slug = ? LIMIT 1",
      [id, id],
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(normalizeProject(projects[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const [slugConflict] = await pool.query(
      "SELECT id FROM projects WHERE slug = ? AND id <> ? LIMIT 1",
      [project.slug, id],
    );

    if (slugConflict.length > 0) {
      return res.status(400).json({ message: "Another project already uses this slug" });
    }

    await pool.query(
      `UPDATE projects
       SET slug = ?, title = ?, tagline = ?, description = ?, long_description = ?, tech = ?, gallery = ?, price = ?, file = ?, file_name = ?, file_public_id = ?, demo_url = ?, hero_image = ?, hero_image_public_id = ?, image_url = ?, image_public_id = ?, category = ?, is_featured = ?, is_paid = ?
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
        id,
      ],
    );

    const staleImageIds = [existingProject.hero_image_public_id, existingProject.image_public_id].filter(Boolean);
    for (const publicId of staleImageIds) {
      if (publicId !== project.hero_image_public_id && publicId !== project.image_public_id) {
        await destroyCloudinaryAsset(publicId, "image");
      }
    }

    if (existingProject.file_public_id && existingProject.file_public_id !== project.file_public_id) {
      await destroyCloudinaryAsset(existingProject.file_public_id, "raw");
    }

    const updatedProject = await fetchProjectById(id);

    res.json({
      message: "Project updated successfully",
      project: updatedProject ? normalizeProject(updatedProject) : null,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
      details: error.details || undefined,
    });
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
    res.status(500).json({ message: error.message });
  }
};
