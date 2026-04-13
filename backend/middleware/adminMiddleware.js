import pool from "../config/db.js";

export const isAdmin = async (req, res, next) => {
  try {
    // ✅ Auth check
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = Number(req.user.id);

    // ✅ ID validation
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid user" });
    }

    // ✅ Fast path (JWT role) + small safety check
    if (req.user.role === "admin") {
      return next();
    }

    // ✅ DB verification (fallback + safety)
    const [users] = await pool.query(
      "SELECT role FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!users.length) {
      return res.status(401).json({ message: "User not found" });
    }

    const role = users[0].role;

    if (role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // ✅ update role in request
    req.user.role = role;

    next();

  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};