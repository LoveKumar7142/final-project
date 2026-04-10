import pool from "../config/db.js";

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    let role = req.user.role;

    if (!role && req.user.id) {
      const [users] = await pool.query(
        "SELECT role FROM users WHERE id = ? LIMIT 1",
        [req.user.id],
      );
      role = users[0]?.role;
    }

    if (role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user.role = role;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

