import pool from "../config/db.js";

// 🔹 Save Contact Message
export const saveMessage = async (req, res) => {
  try {
    const { name, email, message, type } = req.body;

    await pool.query(
      "INSERT INTO messages (name, email, message, type) VALUES (?, ?, ?, ?)",
      [name, email, message, type || "contact"],
    );

    res.json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
