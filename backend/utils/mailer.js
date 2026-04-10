import nodemailer from "nodemailer";
import pool from "../config/db.js";

const toBoolean = (value) => String(value || "").toLowerCase() === "true";

const getEnvOrderRecipients = () => {
  const recipients = [
    process.env.ORDER_EMAIL_ADMIN,
    process.env.ORDER_EMAIL_CONTACT,
    process.env.ORDER_EMAIL_SUPPORT,
    process.env.ORDER_EMAIL_SALES,
    process.env.ORDER_EMAIL_INFO,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (recipients.length > 0) {
    return recipients;
  }

  return (process.env.ORDER_NOTIFICATION_RECIPIENTS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

const getSiteSettingsMap = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?, ?, ?, ?, ?, ?)",
      [
        "order_email_admin",
        "order_email_contact",
        "order_email_support",
        "order_email_sales",
        "order_email_info",
        "order_email_noreply",
      ],
    );

    return rows.reduce((accumulator, row) => {
      accumulator[row.setting_key] = row.setting_value;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
};

const getNotificationConfig = async () => {
  const settings = await getSiteSettingsMap();
  const recipients = getEnvOrderRecipients();

  return {
    recipients,
    from:
      process.env.SMTP_FROM?.trim()
      || settings.order_email_noreply?.trim()
      || process.env.ORDER_EMAIL_NOREPLY?.trim(),
    settings,
  };
};

const uniqueRecipients = (values) => [...new Set(values.map((value) => value?.trim()).filter(Boolean))];

const createTransporter = () => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: toBoolean(process.env.SMTP_SECURE),
    auth: {
      user,
      pass,
    },
  });
};

export const sendOrderNotificationEmail = async ({
  name,
  email,
  projectType,
  description,
  budget,
  razorpayOrderId,
  razorpayPaymentId,
}) => {
  const transporter = createTransporter();
  const { from, settings } = await getNotificationConfig();
  const finalRecipients = uniqueRecipients([
    settings.order_email_admin,
    settings.order_email_sales,
    process.env.ORDER_EMAIL_ADMIN,
    process.env.ORDER_EMAIL_SALES,
  ]);

  if (!transporter || !from || finalRecipients.length === 0) {
    return {
      skipped: true,
      reason: "Email notification config is incomplete",
    };
  }

  const safeDescription = description?.trim() || "No description provided";
  const safeBudget = Number.isFinite(Number(budget)) ? Number(budget) : budget;

  await transporter.sendMail({
    from,
    to: finalRecipients,
    subject: `New Portfolio Order: ${projectType || "Custom Project"}`,
    replyTo: email,
    text: [
      "A new portfolio order has been received.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Project Type: ${projectType || "Custom Project"}`,
      `Budget: ${safeBudget}`,
      `Razorpay Order ID: ${razorpayOrderId}`,
      `Razorpay Payment ID: ${razorpayPaymentId}`,
      "",
      "Description:",
      safeDescription,
    ].join("\n"),
    html: `
      <h2>New Portfolio Order Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Project Type:</strong> ${projectType || "Custom Project"}</p>
      <p><strong>Budget:</strong> ${safeBudget}</p>
      <p><strong>Razorpay Order ID:</strong> ${razorpayOrderId}</p>
      <p><strong>Razorpay Payment ID:</strong> ${razorpayPaymentId}</p>
      <p><strong>Description:</strong></p>
      <p>${safeDescription.replace(/\n/g, "<br />")}</p>
    `,
  });

  return {
    skipped: false,
    recipients: finalRecipients,
  };
};

export const sendProjectSaleNotificationEmail = async ({
  customerName,
  customerEmail,
  projectTitle,
  amount,
  paymentId,
}) => {
  const transporter = createTransporter();
  const { from, settings } = await getNotificationConfig();
  const recipients = uniqueRecipients([
    settings.order_email_sales,
    settings.order_email_admin,
    process.env.ORDER_EMAIL_SALES,
    process.env.ORDER_EMAIL_ADMIN,
  ]);

  if (!transporter || !from || recipients.length === 0) {
    return { skipped: true, reason: "Email notification config is incomplete" };
  }

  await transporter.sendMail({
    from,
    to: recipients,
    subject: `New Project Sale: ${projectTitle}`,
    replyTo: customerEmail,
    text: [
      "A new project sale has been completed.",
      "",
      `Customer Name: ${customerName}`,
      `Customer Email: ${customerEmail}`,
      `Project: ${projectTitle}`,
      `Amount: ${amount}`,
      `Payment ID: ${paymentId}`,
    ].join("\n"),
  });

  return { skipped: false, recipients };
};

export const sendContactNotificationEmail = async ({
  name,
  email,
  message,
  type,
}) => {
  const transporter = createTransporter();
  const settings = await getSiteSettingsMap();
  const from =
    process.env.SMTP_FROM?.trim()
    || settings.order_email_noreply?.trim()
    || process.env.ORDER_EMAIL_NOREPLY?.trim();
  const recipients = uniqueRecipients([
    settings.order_email_contact,
    settings.order_email_admin,
    process.env.ORDER_EMAIL_CONTACT,
    process.env.ORDER_EMAIL_ADMIN,
  ]);

  if (!transporter || !from || recipients.length === 0) {
    return { skipped: true, reason: "Contact email config is incomplete" };
  }

  await transporter.sendMail({
    from,
    to: recipients,
    replyTo: email,
    subject: `New ${type || "contact"} message from ${name}`,
    text: [
      "A new portfolio contact message has been received.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Type: ${type || "contact"}`,
      "",
      "Message:",
      message,
    ].join("\n"),
  });

  return { skipped: false, recipient: recipients.join(", ") };
};

export const sendAutoReplyEmail = async ({
  to,
  subject,
  intro,
  body,
}) => {
  const transporter = createTransporter();
  const settings = await getSiteSettingsMap();
  const from =
    process.env.SMTP_FROM?.trim()
    || settings.order_email_noreply?.trim()
    || process.env.ORDER_EMAIL_NOREPLY?.trim();

  if (!transporter || !from || !to) {
    return { skipped: true, reason: "Auto reply config is incomplete" };
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text: [intro, "", body].join("\n"),
  });

  return { skipped: false, recipient: to };
};

export const sendOtpVerificationEmail = async ({
  name,
  email,
  otpCode,
}) => {
  const transporter = createTransporter();
  const settings = await getSiteSettingsMap();
  const from =
    process.env.SMTP_FROM?.trim()
    || settings.order_email_noreply?.trim()
    || process.env.ORDER_EMAIL_NOREPLY?.trim();

  if (!transporter || !from || !email || !otpCode) {
    return { skipped: true, reason: "OTP email config is incomplete" };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: "Verify your email address",
    text: [
      `Hi ${name || "there"},`,
      "",
      "Use the OTP below to verify your email address and complete registration:",
      "",
      otpCode,
      "",
      "This OTP expires in 10 minutes.",
    ].join("\n"),
  });

  return { skipped: false, recipient: email };
};
