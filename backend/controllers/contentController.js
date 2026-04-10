import pool from "../config/db.js";

const getProfile = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM portfolio_profile ORDER BY id ASC LIMIT 1",
  );
  return rows[0] || null;
};

const getSection = async (sectionKey) => {
  const [rows] = await pool.query(
    "SELECT * FROM about_sections WHERE section_key = ? LIMIT 1",
    [sectionKey],
  );
  return rows[0] || null;
};

const getItems = async (sectionKey) => {
  const [rows] = await pool.query(
    "SELECT * FROM about_items WHERE section_key = ? ORDER BY sort_order ASC, id ASC",
    [sectionKey],
  );
  return rows;
};

const getSiteAssets = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM site_assets ORDER BY sort_order ASC, id ASC",
  );
  return rows;
};

const parseJsonField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

const parseProject = (project) => ({
  ...project,
  tech: parseJsonField(project.tech),
  gallery: parseJsonField(project.gallery),
});

export const getHomeContent = async (req, res) => {
  try {
    const profile = await getProfile();
    const [stats] = await pool.query(
      "SELECT * FROM home_stats ORDER BY sort_order ASC, id ASC",
    );
    const [capabilities] = await pool.query(
      "SELECT * FROM home_capabilities ORDER BY sort_order ASC, id ASC",
    );
    const [services] = await pool.query(
      "SELECT * FROM service_offerings WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC",
    );
    const [featuredProjects] = await pool.query(
      "SELECT * FROM projects WHERE is_featured = TRUE ORDER BY id ASC LIMIT 3",
    );
    const projectJourney = await getItems("project_journey");
    const learningNow = await getItems("learning_now");
    const currentWork = await getSection("current_work");
    const siteAssets = await getSiteAssets();

    res.json({
      profile,
      stats,
      capabilities,
      services,
      projectJourney,
      learningNow,
      currentWork,
      siteAssets,
      featuredProjects: featuredProjects.map(parseProject),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAboutContent = async (req, res) => {
  try {
    const profile = await getProfile();
    const [socialLinks] = await pool.query(
      "SELECT * FROM social_links ORDER BY sort_order ASC, id ASC",
    );
    const siteAssets = await getSiteAssets();

    const [story, currentWork, closingNote, education, achievements, projectJourney, learningNow, differentiators, beyondCode] = await Promise.all([
      getSection("about_story"),
      getSection("current_work"),
      getSection("closing_note"),
      getItems("education"),
      getItems("achievements"),
      getItems("project_journey"),
      getItems("learning_now"),
      getItems("differentiators"),
      getItems("beyond_code"),
    ]);

    res.json({
      profile,
      socialLinks,
      siteAssets,
      story,
      currentWork,
      closingNote,
      education,
      achievements,
      projectJourney,
      learningNow,
      differentiators,
      beyondCode,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSiteAssetsContent = async (req, res) => {
  try {
    const siteAssets = await getSiteAssets();
    res.json(siteAssets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
