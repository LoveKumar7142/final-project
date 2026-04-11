import pool from "../config/db.js";
import { sendAutoReplyEmail, sendOrderNotificationEmail } from "../utils/mailer.js";
import { getRazorpay } from "../config/razorpay.js";

// 🔹 Create Order (Hire Me)
export const createHireOrder = async (req, res) => {
  try {
    const razorpay = await getRazorpay();
    const { name, email, project_type, description, budget } = req.body;

    // 👉 60% advance
    const advance = Math.floor(budget * 0.6 * 100);

    const options = {
      amount: advance,
      currency: "INR",
      receipt: `hire_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // ✅ Save order in DB
    await pool.query(
      "INSERT INTO orders (name, email, project_type, description, budget, advance_paid, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, project_type, description, budget, true, "pending"],
    );

    try {
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
    res.status(500).json({ message: error.message });
  }
};
