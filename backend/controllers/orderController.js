import pool from "../config/db.js";
import { createRazorpayOrder } from "../utils/razorpayApi.js";

const loadMailer = async () => import("../utils/mailer.js");

// 🔹 Create Order (Hire Me)
export const createHireOrder = async (req, res) => {
  try {
    const { name, email, project_type, description, budget } = req.body;
    // ✅ Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Invalid name" });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const safeBudget = Number(budget);

    if (!Number.isInteger(safeBudget) || safeBudget < 1000) {
      return res.status(400).json({ message: "Invalid budget" });
    }

    // 👉 60% advance
    const advance = Math.floor(safeBudget * 0.6 * 100);

    const options = {
      amount: advance,
      currency: "INR",
      receipt: `hire_${Date.now()}`,
    };

    const order = await createRazorpayOrder(options);

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 Verify Hire Payment + Save Order
export const verifyHirePayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
      project_type,
      description,
      budget,
    } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    // 🔐 Verify signature
    const crypto = await import("crypto");

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // ✅ Duplicate payment check (ADD HERE)
    const [existing] = await pool.query(
      "SELECT id FROM orders WHERE razorpay_payment_id = ? LIMIT 1",
      [razorpay_payment_id],
    );

    if (existing.length > 0) {
      return res.json({ message: "Payment already processed" });
    }

    // ✅ Save order in DB
    await pool.query(
      "INSERT INTO orders (name, email, project_type, description, budget, advance_paid, status, razorpay_order_id, razorpay_payment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        email,
        project_type,
        description,
        budget,
        true,
        "pending",
        razorpay_order_id,
        razorpay_payment_id,
      ],
    );

    try {
      const { sendAutoReplyEmail, sendOrderNotificationEmail } =
        await loadMailer();

      await sendOrderNotificationEmail({
        name,
        email,
        projectType: project_type,
        description,
        budget,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
      await sendAutoReplyEmail({
        to: email,
        subject: "Your order has been received",
        intro: `Hi ${name},`,
        body: "Thanks for placing your order. Your payment has been verified successfully and we will reach out to you shortly with the next steps.",
      });
    } catch (emailError) {
      console.error("Order notification email failed:", emailError.message);
    }

    res.json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
