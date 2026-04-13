﻿import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Strict Bearer check
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Validate decoded data
    if (!decoded.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // ✅ Optional (HIGH SECURITY): DB check
    const [users] = await pool.query(
      "SELECT id, role FROM users WHERE id=? LIMIT 1",
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ attach fresh data
    req.user = users[0];

    next();

  } catch (error) {
    console.error("AUTH ERROR:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};