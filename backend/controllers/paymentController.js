import crypto from "crypto";
import pool from "../config/db.js";
import {
  sendAutoReplyEmail,
  sendProjectSaleNotificationEmail,
} from "../utils/mailer.js";
import { getRazorpay } from "../config/razorpay.js";

// 🔹 Create Order
export const createOrder = async (req, res) => {
  try {
    const razorpay = await getRazorpay();
    const { projectId } = req.body;
    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const [project] = await pool.query("SELECT * FROM projects WHERE id=?", [
      projectId,
    ]);

    if (project.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const amount = project[0].price * 100; // paise

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("PROJECT PAYMENT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      projectId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }
    // ✅ Duplicate check
    const [existing] = await pool.query(
      "SELECT id FROM purchases WHERE payment_id = ? LIMIT 1",
      [razorpay_payment_id],
    );

    if (existing.length > 0) {
      return res.json({ message: "Payment already processed" });
    }

    // ✅ Save purchase
    await pool.query(
      "INSERT INTO purchases (user_id, project_id, payment_status, payment_id, razorpay_order_id) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.id,
        projectId,
        "completed",
        razorpay_payment_id,
        razorpay_order_id,
      ],
    );

    const [projects] = await pool.query(
      "SELECT title, price FROM projects WHERE id = ?",
      [projectId],
    );
    const [users] = await pool.query(
      "SELECT name, email FROM users WHERE id = ?",
      [req.user.id],
    );
    const project = projects[0];
    const user = users[0];

    try {
      await sendProjectSaleNotificationEmail({
        customerName: user?.name || "Customer",
        customerEmail: user?.email || "",
        projectTitle: project?.title || `Project #${projectId}`,
        amount: project?.price || 0,
        paymentId: razorpay_payment_id,
      });

      await sendAutoReplyEmail({
        to: user?.email || "",
        subject: `Payment received for ${project?.title || "your project"}`,
        intro: `Hi ${user?.name || "there"},`,
        body: `Your payment has been received successfully for ${project?.title || "the selected project"}. You can now access your purchase from your account.`,
      });
    } catch (mailError) {
      console.error("Project sale email flow failed:", mailError.message);
    }

    res.json({ message: "Payment successful" });
  } catch (error) {
    console.error("PROJECT PAYMENT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
