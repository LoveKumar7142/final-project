import pool from "../config/db.js";

export const acceptAgreement = async (req, res) => {
  try {
    // ✅ Auth check
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = Number(req.user.id);
    const projectId = Number(req.body.project_id);

    // ✅ Validation
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid user" });
    }

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // ✅ Single query (race condition safe)
    const [result] = await pool.query(
      `INSERT INTO agreements (user_id, project_id, accepted)
       VALUES (?, ?, true)
       ON DUPLICATE KEY UPDATE accepted = true`,
      [userId, projectId]
    );

    // ✅ Response handling
    if (result.affectedRows === 1) {
      return res.json({ message: "Agreement accepted" });
    } else {
      return res.json({ message: "Already accepted" });
    }

  } catch (error) {
    console.error("ACCEPT AGREEMENT ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};