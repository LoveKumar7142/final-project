import pool from "../config/db.js";
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute
setInterval(
  () => {
    cache.clear();
  },
  5 * 60 * 1000,
);

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

  if (typeof value !== "string") return [];

  if (value.length > 5000) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};


const parseProject = (project = {}) => ({
  ...project,
  tech: parseJsonField(project.tech),
  gallery: parseJsonField(project.gallery),
});

export const getHomeContent = async (req, res) => {
  try {
    const cacheKey = "home";

    if (cache.has(cacheKey)) {
      const { data, time } = cache.get(cacheKey);
      if (Date.now() - time < CACHE_TTL) {
        return res.json(data);
      }
    }

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

    const response = {
      profile,
      stats,
      capabilities,
      services,
      projectJourney,
      learningNow,
      currentWork,
      siteAssets,
      featuredProjects: featuredProjects.map(parseProject),
    };

    cache.set(cacheKey, { data: response, time: Date.now() });

    res.json(response);
  } catch (error) {
    console.error("CONTENT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAboutContent = async (req, res) => {
  try {
    const cacheKey = "about";

    if (cache.has(cacheKey)) {
      const { data, time } = cache.get(cacheKey);
      if (Date.now() - time < CACHE_TTL) {
        return res.json(data);
      }
    }

    const profile = await getProfile();
    const [socialLinks] = await pool.query(
      "SELECT * FROM social_links ORDER BY sort_order ASC, id ASC",
    );
    const siteAssets = await getSiteAssets();

    const [
      story,
      currentWork,
      closingNote,
      education,
      achievements,
      projectJourney,
      learningNow,
      differentiators,
      beyondCode,
    ] = await Promise.all([
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

    const response = {
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
    };

    cache.set(cacheKey, { data: response, time: Date.now() });

    res.json(response);
  } catch (error) {
    console.error("CONTENT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSiteAssetsContent = async (req, res) => {
  try {
    const cacheKey = "siteAssets";

    if (cache.has(cacheKey)) {
      const { data, time } = cache.get(cacheKey);
      if (Date.now() - time < CACHE_TTL) {
        return res.json(data);
      }
    }

    const siteAssets = await getSiteAssets();

    const response = siteAssets;

    cache.set(cacheKey, { data: response, time: Date.now() });

    res.json(response);
  } catch (error) {
    console.error("CONTENT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLegalContent = async (req, res) => {
  try {
    const cacheKey = "legal_pages";

    if (cache.has(cacheKey)) {
      const { data, time } = cache.get(cacheKey);
      if (Date.now() - time < CACHE_TTL) {
        return res.json(data);
      }
    }

    const [rows] = await pool.query("SELECT * FROM legal_pages");
    
    // Convert array of pages into a lookup object
    const response = rows.reduce((acc, row) => {
      let contentObj = {};
      try {
        // We do standard JSON.parse because parseJsonField strictly forces Arrays!
        contentObj = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
      } catch (e) {
        contentObj = { sections: [] };
      }

      acc[row.page_key] = {
        title: row.title,
        content: contentObj,
        last_updated: row.last_updated
      };
      return acc;
    }, {});

    cache.set(cacheKey, { data: response, time: Date.now() });

    res.json(response);
  } catch (error) {
    console.error("CONTENT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
