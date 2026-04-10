import pool from "../config/db.js";

const toText = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }
  return false;
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const readContentBundle = async () => {
  const [profileRows] = await pool.query(
    "SELECT * FROM portfolio_profile ORDER BY id ASC LIMIT 1",
  );
  const [siteAssets] = await pool.query(
    "SELECT * FROM site_assets ORDER BY sort_order ASC, id ASC",
  );
  const [socialLinks] = await pool.query(
    "SELECT * FROM social_links ORDER BY sort_order ASC, id ASC",
  );
  const [homeStats] = await pool.query(
    "SELECT * FROM home_stats ORDER BY sort_order ASC, id ASC",
  );
  const [capabilities] = await pool.query(
    "SELECT * FROM home_capabilities ORDER BY sort_order ASC, id ASC",
  );
  const [services] = await pool.query(
    "SELECT * FROM service_offerings ORDER BY sort_order ASC, id ASC",
  );
  const [aboutSections] = await pool.query(
    "SELECT * FROM about_sections ORDER BY sort_order ASC, id ASC",
  );
  const [aboutItems] = await pool.query(
    "SELECT * FROM about_items ORDER BY section_key ASC, sort_order ASC, id ASC",
  );

  return {
    profile: profileRows[0] || null,
    siteAssets,
    socialLinks,
    homeStats,
    capabilities,
    services,
    aboutSections,
    aboutItems,
  };
};

export const getAdminSummary = async (req, res) => {
  try {
    const [[projectCount], [orderCount], [messageCount], [featuredCount]] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM projects"),
      pool.query("SELECT COUNT(*) AS total FROM orders"),
      pool.query("SELECT COUNT(*) AS total FROM messages"),
      pool.query("SELECT COUNT(*) AS total FROM projects WHERE is_featured = TRUE"),
    ]);

    res.json({
      totals: {
        projects: projectCount[0]?.total || 0,
        orders: orderCount[0]?.total || 0,
        messages: messageCount[0]?.total || 0,
        featuredProjects: featuredCount[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const [orders] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC, id DESC");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM orders WHERE id = ?", [id]);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const [messages] = await pool.query("SELECT * FROM messages ORDER BY created_at DESC, id DESC");
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM messages WHERE id = ?", [id]);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminContent = async (req, res) => {
  try {
    const content = await readContentBundle();
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveAdminContent = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const existingContent = await readContentBundle();
    const profile = req.body.profile || {};
    const siteAssets = normalizeArray(req.body.siteAssets);
    const socialLinks = normalizeArray(req.body.socialLinks);
    const homeStats = normalizeArray(req.body.homeStats);
    const capabilities = normalizeArray(req.body.capabilities);
    const services = normalizeArray(req.body.services);
    const aboutSections = normalizeArray(req.body.aboutSections);
    const aboutItems = normalizeArray(req.body.aboutItems);

    await connection.beginTransaction();

    if (existingContent.profile?.id) {
      await connection.query(
        `UPDATE portfolio_profile
         SET full_name = ?, headline = ?, subheadline = ?, hero_title = ?, hero_description = ?, hero_image = ?, hero_image_public_id = ?, about_intro = ?, current_company = ?, current_role = ?, current_summary = ?, location = ?, email = ?, phone = ?
         WHERE id = ?`,
        [
          toText(profile.full_name) || existingContent.profile.full_name,
          toText(profile.headline),
          toText(profile.subheadline),
          toText(profile.hero_title),
          toText(profile.hero_description),
          profile.hero_image !== undefined ? toText(profile.hero_image) : existingContent.profile.hero_image,
          profile.hero_image_public_id !== undefined
            ? toText(profile.hero_image_public_id)
            : existingContent.profile.hero_image_public_id,
          toText(profile.about_intro),
          toText(profile.current_company),
          toText(profile.current_role),
          toText(profile.current_summary),
          toText(profile.location),
          toText(profile.email),
          toText(profile.phone),
          existingContent.profile.id,
        ],
      );
    } else {
      await connection.query(
        `INSERT INTO portfolio_profile
         (full_name, headline, subheadline, hero_title, hero_description, hero_image, hero_image_public_id, about_intro, current_company, current_role, current_summary, location, email, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          toText(profile.full_name) || "Love Kumar",
          toText(profile.headline),
          toText(profile.subheadline),
          toText(profile.hero_title),
          toText(profile.hero_description),
          toText(profile.hero_image),
          toText(profile.hero_image_public_id),
          toText(profile.about_intro),
          toText(profile.current_company),
          toText(profile.current_role),
          toText(profile.current_summary),
          toText(profile.location),
          toText(profile.email),
          toText(profile.phone),
        ],
      );
    }

    await connection.query("DELETE FROM site_assets");
    for (let index = 0; index < siteAssets.length; index += 1) {
      const item = siteAssets[index];
      await connection.query(
        "INSERT INTO site_assets (asset_key, label, asset_url, asset_public_id, sort_order) VALUES (?, ?, ?, ?, ?)",
        [
          toText(item.asset_key),
          toText(item.label) || toText(item.asset_key),
          toText(item.asset_url),
          toText(item.asset_public_id),
          toNumber(item.sort_order, index + 1),
        ],
      );
    }

    await connection.query("DELETE FROM social_links");
    for (let index = 0; index < socialLinks.length; index += 1) {
      const item = socialLinks[index];
      await connection.query(
        "INSERT INTO social_links (label, url, icon, sort_order) VALUES (?, ?, ?, ?)",
        [toText(item.label), toText(item.url), toText(item.icon), toNumber(item.sort_order, index + 1)],
      );
    }

    await connection.query("DELETE FROM home_stats");
    for (let index = 0; index < homeStats.length; index += 1) {
      const item = homeStats[index];
      await connection.query(
        "INSERT INTO home_stats (label, value, sort_order) VALUES (?, ?, ?)",
        [toText(item.label), toText(item.value), toNumber(item.sort_order, index + 1)],
      );
    }

    await connection.query("DELETE FROM home_capabilities");
    for (let index = 0; index < capabilities.length; index += 1) {
      const item = capabilities[index];
      await connection.query(
        "INSERT INTO home_capabilities (title, description, icon, sort_order) VALUES (?, ?, ?, ?)",
        [toText(item.title), toText(item.description), toText(item.icon), toNumber(item.sort_order, index + 1)],
      );
    }

    await connection.query("DELETE FROM service_offerings");
    for (let index = 0; index < services.length; index += 1) {
      const item = services[index];
      await connection.query(
        "INSERT INTO service_offerings (title, description, icon, badge, cta_text, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          toText(item.title),
          toText(item.description),
          toText(item.icon),
          toText(item.badge),
          toText(item.cta_text),
          toNumber(item.sort_order, index + 1),
          toBoolean(item.is_active),
        ],
      );
    }

    await connection.query("DELETE FROM about_sections");
    for (let index = 0; index < aboutSections.length; index += 1) {
      const item = aboutSections[index];
      await connection.query(
        "INSERT INTO about_sections (section_key, title, description, sort_order) VALUES (?, ?, ?, ?)",
        [
          toText(item.section_key),
          toText(item.title),
          toText(item.description),
          toNumber(item.sort_order, index + 1),
        ],
      );
    }

    await connection.query("DELETE FROM about_items");
    for (let index = 0; index < aboutItems.length; index += 1) {
      const item = aboutItems[index];
      await connection.query(
        "INSERT INTO about_items (section_key, title, description, meta_value, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [
          toText(item.section_key),
          toText(item.title),
          toText(item.description),
          toText(item.meta_value),
          toText(item.icon),
          toNumber(item.sort_order, index + 1),
        ],
      );
    }

    await connection.commit();

    const updatedContent = await readContentBundle();
    res.json({
      message: "Admin content updated successfully",
      content: updatedContent,
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};
