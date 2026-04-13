import pool from "../config/db.js";
import { sendAutoReplyEmail, sendContactNotificationEmail } from "../utils/mailer.js";

export const saveMessage = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const message = String(req.body.message || "").trim();
    const type = String(req.body.type || "contact").trim();

    // ✅ Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Invalid name" });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (!message || message.length < 5 || message.length > 1000) {
      return res.status(400).json({ message: "Invalid message" });
    }

    // ✅ Basic sanitization (lightweight)
    const safeMessage = message.replace(/<[^>]*>?/gm, "");

    // ✅ Save to DB
    await pool.query(
      "INSERT INTO messages (name, email, message, type) VALUES (?, ?, ?, ?)",
      [name, email, safeMessage, type]
    );

    // ✅ Send emails (non-blocking safe)
    try {
      await sendContactNotificationEmail({ name, email, message: safeMessage, type });

      await sendAutoReplyEmail({
        to: email,
        subject: "We received your message",
        intro: `Hi ${name},`,
        body: "Thanks for reaching out. Your message has been received and we will get back to you soon.",
      });

    } catch (mailError) {
      console.error("MAIL ERROR:", mailError.message);
    }

    res.json({ message: "Message sent successfully" });

  } catch (error) {
    console.error("CONTACT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};