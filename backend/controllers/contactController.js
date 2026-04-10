import pool from "../config/db.js";
import { sendAutoReplyEmail, sendContactNotificationEmail } from "../utils/mailer.js";

// 🔹 Save Contact Message
export const saveMessage = async (req, res) => {
  try {
    const { name, email, message, type } = req.body;

    await pool.query(
      "INSERT INTO messages (name, email, message, type) VALUES (?, ?, ?, ?)",
      [name, email, message, type || "contact"],
    );

    try {
      await sendContactNotificationEmail({ name, email, message, type: type || "contact" });
      await sendAutoReplyEmail({
        to: email,
        subject: "We received your message",
        intro: `Hi ${name},`,
        body: "Thanks for reaching out. Your message has been received and we will get back to you soon.",
      });
    } catch (mailError) {
      console.error("Contact email flow failed:", mailError.message);
    }

    res.json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
