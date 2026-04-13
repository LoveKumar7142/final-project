import pool from "../config/db.js";

const sendAdminDebugError = (res, label, error, fallbackMessage = "Internal server error") => {
  console.error(`${label}:`, error);

  const payload = {
    message: error?.message || fallbackMessage,
    details: error?.details || undefined,
  };

  if (process.env.NODE_ENV !== "production") {
    payload.debug = {
      name: error?.name,
      code: error?.code,
      errno: error?.errno,
      sqlMessage: error?.sqlMessage,
      sqlState: error?.sqlState,
      stack: error?.stack,
    };
  }

  return res.status(error?.statusCode || 500).json(payload);
};

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
  const [siteSettings] = await pool.query(
    "SELECT * FROM site_settings ORDER BY sort_order ASC, id ASC",
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
  const [legalPages] = await pool.query(
    "SELECT * FROM legal_pages ORDER BY id ASC",
  );

  return {
    profile: profileRows[0] || null,
    siteSettings,
    siteAssets,
    socialLinks,
    homeStats,
    capabilities,
    services,
    aboutSections,
    aboutItems,
    legalPages,
  };
};

export const getAdminSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM messages) as messages,
        (SELECT COUNT(*) FROM projects WHERE is_featured = TRUE) as featuredProjects
    `);

    res.json({
      totals: {
        projects: rows[0]?.projects || 0,
        orders: rows[0]?.orders || 0,
        messages: rows[0]?.messages || 0,
        featuredProjects: rows[0]?.featuredProjects || 0,
      },
    });
  } catch (error) {
    return sendAdminDebugError(res, "GET ADMIN SUMMARY ERROR", error);
  }
};

export const getOrders = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const [orders] = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset],
    );

    res.json(orders);
  } catch (error) {
    return sendAdminDebugError(res, "GET ORDERS ERROR", error, "Something went wrong");
  }
};

export const deleteOrder = async (req, res) => {
  try {
    // ✅ Auth check (assume middleware sets req.user)
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const id = Number(req.params.id);

    // ✅ Validation
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const [result] = await pool.query("DELETE FROM orders WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    return sendAdminDebugError(res, "DELETE ORDER ERROR", error, "Something went wrong");
  }
};

export const getMessages = async (req, res) => {
  try {
    const [messages] = await pool.query(
      "SELECT * FROM messages ORDER BY created_at DESC, id DESC",
    );
    res.json(messages);
  } catch (error) {
    return sendAdminDebugError(res, "GET MESSAGES ERROR", error);
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM messages WHERE id = ?", [id]);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    return sendAdminDebugError(res, "DELETE MESSAGE ERROR", error);
  }
};

export const getAdminContent = async (req, res) => {
  try {
    const content = await readContentBundle();
    res.json(content);
  } catch (error) {
    return sendAdminDebugError(res, "GET ADMIN CONTENT ERROR", error);
  }
};

export const saveAdminContent = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const existingContent = await readContentBundle();
    const profile = req.body.profile || {};
    const siteSettings = normalizeArray(req.body.siteSettings);
    const siteAssets = normalizeArray(req.body.siteAssets);
    const socialLinks = normalizeArray(req.body.socialLinks);
    const homeStats = normalizeArray(req.body.homeStats);
    const capabilities = normalizeArray(req.body.capabilities);
    const services = normalizeArray(req.body.services);
    const aboutSections = normalizeArray(req.body.aboutSections);
    const aboutItems = normalizeArray(req.body.aboutItems);
    const legalPages = normalizeArray(req.body.legalPages);

    await connection.beginTransaction();

    if (existingContent.profile?.id) {
      await connection.query(
        `UPDATE portfolio_profile
         SET \`full_name\` = ?, \`headline\` = ?, \`subheadline\` = ?, \`hero_title\` = ?, \`hero_description\` = ?, \`hero_image\` = ?, \`hero_image_public_id\` = ?, \`hero_image_position\` = ?, \`about_intro\` = ?, \`current_company\` = ?, \`current_role\` = ?, \`current_summary\` = ?, \`location\` = ?, \`email\` = ?, \`phone\` = ?
         WHERE \`id\` = ?`,
        [
          toText(profile.full_name) || existingContent.profile.full_name,
          toText(profile.headline),
          toText(profile.subheadline),
          toText(profile.hero_title),
          toText(profile.hero_description),
          profile.hero_image !== undefined
            ? toText(profile.hero_image)
            : existingContent.profile.hero_image,
          profile.hero_image_public_id !== undefined
            ? toText(profile.hero_image_public_id)
            : existingContent.profile.hero_image_public_id,
          profile.hero_image_position !== undefined
            ? toText(profile.hero_image_position)
            : existingContent.profile.hero_image_position || "right",
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
         (\`full_name\`, \`headline\`, \`subheadline\`, \`hero_title\`, \`hero_description\`, \`hero_image\`, \`hero_image_public_id\`, \`hero_image_position\`, \`about_intro\`, \`current_company\`, \`current_role\`, \`current_summary\`, \`location\`, \`email\`, \`phone\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          toText(profile.full_name) || "Love Kumar",
          toText(profile.headline),
          toText(profile.subheadline),
          toText(profile.hero_title),
          toText(profile.hero_description),
          toText(profile.hero_image),
          toText(profile.hero_image_public_id),
          toText(profile.hero_image_position) || "right",
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

    await connection.query("DELETE FROM site_settings");
    if (siteSettings.length > 0) {
      const siteSettingsVals = [];
      const siteSettingsPh = siteSettings
        .map((item, index) => {
          siteSettingsVals.push(
            toText(item.setting_key) || `setting_${index}`,
            toText(item.label) ||
            toText(item.setting_key) ||
            `Setting ${index}`,
            toText(item.setting_value),
            toText(item.setting_group) || "general",
            toNumber(item.sort_order, index + 1),
          );
          return "(?, ?, ?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO site_settings (setting_key, label, setting_value, setting_group, sort_order) VALUES ${siteSettingsPh}`,
        siteSettingsVals,
      );
    }

    await connection.query("DELETE FROM site_assets");
    if (siteAssets.length > 0) {
      const siteAssetsVals = [];
      const siteAssetsPh = siteAssets
        .map((item, index) => {
          siteAssetsVals.push(
            toText(item.asset_key) || `asset_${index}`,
            toText(item.label) || toText(item.asset_key) || `Asset ${index}`,
            toText(item.asset_url),
            toText(item.asset_public_id),
            toNumber(item.sort_order, index + 1),
          );
          return "(?, ?, ?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO site_assets (asset_key, label, asset_url, asset_public_id, sort_order) VALUES ${siteAssetsPh}`,
        siteAssetsVals,
      );
    }

    await connection.query("DELETE FROM social_links");
    if (socialLinks.length > 0) {
      const socialLinksVals = [];
      const socialLinksPh = socialLinks
        .map((item, index) => {
          socialLinksVals.push(
            toText(item.label) || "Link",
            toText(item.url) || "#",
            toText(item.icon),
            toNumber(item.sort_order, index + 1),
          );
          return "(?, ?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO social_links (label, url, icon, sort_order) VALUES ${socialLinksPh}`,
        socialLinksVals,
      );
    }

    await connection.query("DELETE FROM home_stats");
    if (homeStats.length > 0) {
      const homeStatsVals = [];
      const homeStatsPh = homeStats
        .map((item, index) => {
          homeStatsVals.push(
            toText(item.label) || "Stat",
            toText(item.value) || "0",
            toNumber(item.sort_order, index + 1),
          );
          return "(?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO home_stats (label, value, sort_order) VALUES ${homeStatsPh}`,
        homeStatsVals,
      );
    }

    await connection.query("DELETE FROM home_capabilities");
    if (capabilities.length > 0) {
      const capabilitiesVals = [];
      const capabilitiesPh = capabilities
        .map((item, index) => {
          capabilitiesVals.push(
            toText(item.title) || "Capability",
            toText(item.description),
            toText(item.icon),
            toNumber(item.sort_order, index + 1),
          );
          return "(?, ?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO home_capabilities (title, description, icon, sort_order) VALUES ${capabilitiesPh}`,
        capabilitiesVals,
      );
    }

    await connection.query("DELETE FROM service_offerings");
    if (services.length > 0) {
      const servicesVals = [];
      const servicesPh = services
        .map((item, index) => {
          servicesVals.push(
            toText(item.title) || "Service",
            toText(item.description),
            toText(item.icon),
            toText(item.badge),
            toText(item.cta_text),
            toNumber(item.sort_order, index + 1),
            toBoolean(item.is_active),
          );
          return "(?, ?, ?, ?, ?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO service_offerings (title, description, icon, badge, cta_text, sort_order, is_active) VALUES ${servicesPh}`,
        servicesVals,
      );
    }

    await connection.query("DELETE FROM about_sections");
    if (aboutSections.length > 0) {
      const aboutSectionsVals = [];
      const aboutSectionsPh = aboutSections
        .map((item, index) => {
          aboutSectionsVals.push(
            toText(item.section_key) || `section_${index}`,
            toText(item.title) || "Section Title",
            toText(item.description),
            toNumber(item.sort_order, index + 1),
          );
          return "(?, ?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO about_sections (section_key, title, description, sort_order) VALUES ${aboutSectionsPh}`,
        aboutSectionsVals,
      );
    }

    await connection.query("DELETE FROM about_items");
    if (aboutItems.length > 0) {
      const aboutItemsVals = [];
      const aboutItemsPh = aboutItems
        .map((item, index) => {
          aboutItemsVals.push(
            toText(item.section_key) || "default_section",
            toText(item.title),
            toText(item.description),
            toText(item.meta_value),
            toText(item.icon),
            toNumber(item.sort_order, index + 1),
          );
          return "(?, ?, ?, ?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO about_items (section_key, title, description, meta_value, icon, sort_order) VALUES ${aboutItemsPh}`,
        aboutItemsVals,
      );
    }

    await connection.query("DELETE FROM legal_pages");
    if (legalPages.length > 0) {
      const legalPagesVals = [];
      const legalPagesPh = legalPages
        .map((item, index) => {
          legalPagesVals.push(
            toText(item.page_key) || `page_${index}`,
            toText(item.title) || "Legal Page",
            typeof item.content === "string" ? item.content : JSON.stringify(item.content || {}),
          );
          return "(?, ?, ?)";
        })
        .join(",");
      await connection.query(
        `INSERT INTO legal_pages (page_key, title, content) VALUES ${legalPagesPh}`,
        legalPagesVals,
      );
    }

    await connection.commit();
    connection.release(); // 🔥 Critical: Free connection before heavy read

    const updatedContent = await readContentBundle();
    res.json({
      message: "Admin content updated successfully",
      content: updatedContent,
    });
  } catch (error) {
    console.error("ADMIN UDPATE ERROR:", error);
    import("fs")
      .then((fs) =>
        fs.writeFileSync("admin_error.log", error.stack || error.message),
      )
      .catch(() => { });
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) { }
    }
    return sendAdminDebugError(res, "ADMIN UPDATE ERROR", error);
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (e) { }
    }
  }
};
