import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.post("/accept", async (req, res) => {
  try {
    const { type } = req.body;
    
    // IP string resolution for reverse proxies (Nginx/Hosting platforms)
    const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Basic validation to prevent arbitrary logging
    if (!type || !['all', 'essential'].includes(type)) {
      return res.status(400).json({ message: "Invalid consent type" });
    }

    // Insert logging into database
    await pool.query(
      "INSERT INTO user_consents (ip_address, user_agent, consent_type) VALUES (?, ?, ?)",
      [ip, userAgent, type]
    );

    res.json({ message: "Consent legally recorded." });
  } catch (error) {
    console.error("CONSENT LOG ERROR:", error);
    // Suppress heavy database errors to client side
    res.status(500).json({ message: "Failed to record consent securely" });
  }
});

export default router;
