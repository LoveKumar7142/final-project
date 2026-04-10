import pool from "../config/db.js";

// 🔹 Accept Agreement
export const acceptAgreement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id } = req.body;

    // check already accepted
    const [existing] = await pool.query(
      "SELECT * FROM agreements WHERE user_id=? AND project_id=?",
      [userId, project_id],
    );

    if (existing.length > 0) {
      return res.json({ message: "Already accepted" });
    }

    await pool.query(
      "INSERT INTO agreements (user_id, project_id, accepted) VALUES (?, ?, ?)",
      [userId, project_id, true],
    );

    res.json({ message: "Agreement accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
