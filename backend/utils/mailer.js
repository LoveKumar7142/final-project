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

  const smtpUser = process.env.SMTP_USER?.trim();

  return {
    recipients,
    from: `"Portfolio System" <${process.env.SMTP_FROM?.trim()
      || settings.order_email_noreply?.trim()
      || process.env.ORDER_EMAIL_NOREPLY?.trim()
      || smtpUser}>`,
    settings,
  };
};

const uniqueRecipients = (values) => [...new Set(values.map((value) => value?.trim()).filter(Boolean))];

const htmlWrapper = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
    .header { background-color: #111827; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
    .content { padding: 40px; color: #374151; font-size: 16px; line-height: 1.6; }
    .content h2 { color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .data-table th, .data-table td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; text-align: left; }
    .data-table th { color: #6b7280; font-weight: 500; font-size: 14px; width: 40%; }
    .data-table td { font-weight: 500; color: #111827; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px; }
    .footer { background-color: #f9fafb; padding: 24px 40px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .otp-code { font-size: 36px; font-weight: 700; color: #111827; letter-spacing: 6px; text-align: center; margin: 32px 0; padding: 24px; background-color: #f3f4f6; border-radius: 12px; }
    .message-box { background-color: #f9fafb; border-left: 4px solid #111827; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0; font-style: italic; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      This is an automated message from your Portfolio System.<br>
      Please do not reply to this email directly unless instructed.
    </div>
  </div>
</body>
</html>
`;

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

  const htmlContent = htmlWrapper("New Order Received", `
    <h2>Project Consultation Request</h2>
    <p>A new order request has been submitted on your portfolio. Here are the details:</p>
    <table class="data-table">
      <tr><th>Name</th><td>${name}</td></tr>
      <tr><th>Email</th><td><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td></tr>
      <tr><th>Project Type</th><td>${projectType || "Custom Project"}</td></tr>
      <tr><th>Budget</th><td>${safeBudget}</td></tr>
      <tr><th>Razorpay Order ID</th><td>${razorpayOrderId || "N/A"}</td></tr>
      <tr><th>Razorpay Payment ID</th><td>${razorpayPaymentId || "N/A"}</td></tr>
    </table>
    <p><strong>Project Description & Requirements:</strong></p>
    <div class="message-box">${safeDescription}</div>
  `);

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
      `Razorpay Order ID: ${razorpayOrderId || "N/A"}`,
      `Razorpay Payment ID: ${razorpayPaymentId || "N/A"}`,
      "",
      "Description:",
      safeDescription,
    ].join("\n"),
    html: htmlContent,
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

  const htmlContent = htmlWrapper("New Digital Sale", `
    <h2>Project Sale Confirmation</h2>
    <p>Great news! A customer has successfully purchased a project from your portfolio.</p>
    <table class="data-table">
      <tr><th>Customer Name</th><td>${customerName}</td></tr>
      <tr><th>Customer Email</th><td><a href="mailto:${customerEmail}" style="color: #2563eb;">${customerEmail}</a></td></tr>
      <tr><th>Project Purchased</th><td>${projectTitle}</td></tr>
      <tr><th>Amount Paid</th><td>${amount}</td></tr>
      <tr><th>Payment ID</th><td>${paymentId || "N/A"}</td></tr>
    </table>
  `);

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
      `Payment ID: ${paymentId || "N/A"}`,
    ].join("\n"),
    html: htmlContent,
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

  const htmlContent = htmlWrapper("New Message Received", `
    <h2>Incoming ${type || "Contact"} Request</h2>
    <p>You have received a new message from your portfolio website.</p>
    <table class="data-table">
      <tr><th>Name</th><td>${name}</td></tr>
      <tr><th>Email</th><td><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td></tr>
      <tr><th>Source/Type</th><td><span style="background: #e5e7eb; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #374151;">${type || "Contact"}</span></td></tr>
    </table>
    <p><strong>Message Content:</strong></p>
    <div class="message-box">${message}</div>
    <p style="margin-top: 32px;"><a href="mailto:${email}" class="button" style="padding: 10px 20px; font-size: 14px;">Reply to ${name}</a></p>
  `);


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
    html: htmlContent,
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

  const htmlContent = htmlWrapper(subject, `
    <p>${intro}</p>
    <p>${body.replace(/\n/g, "<br>")}</p>
  `);

  await transporter.sendMail({
    from,
    to,
    subject,
    text: [intro, "", body].join("\n"),
    html: htmlContent,
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

  const htmlContent = htmlWrapper("Email Verification required", `
    <p>Hi ${name || "there"},</p>
    <p>We received a request to verify your email address to complete registration on our platform.</p>
    <p>Please enter the following OTP code to proceed:</p>
    <div class="otp-code">${otpCode}</div>
    <p style="color: #6b7280; font-size: 14px;">This OTP will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
  `);

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
    html: htmlContent,
  });

  return { skipped: false, recipient: email };
};

export const sendPasswordResetEmail = async ({
  name,
  email,
  resetUrl,
}) => {
  const transporter = createTransporter();
  const settings = await getSiteSettingsMap();
  const from =
    process.env.SMTP_FROM?.trim()
    || settings.order_email_noreply?.trim()
    || process.env.ORDER_EMAIL_NOREPLY?.trim();

  if (!transporter || !from || !email || !resetUrl) {
    return { skipped: true, reason: "Password reset email config is incomplete" };
  }

  const htmlContent = htmlWrapper("Password Reset Request", `
    <p>Hi ${name || "there"},</p>
    <p>You recently requested to reset your password for your account. Please click the button below to secure your account and set a new password.</p>
    <div class="button-container">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p style="color: #6b7280; font-size: 14px; word-break: break-all;">Or copy and paste this link into your browser:<br>${resetUrl}</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
  `);

  await transporter.sendMail({
    from,
    to: email,
    subject: "Reset your password",
    text: [
      `Hi ${name || "there"},`,
      "",
      "You recently requested to reset your password for your account.",
      "Click the link below to reset it:",
      "",
      resetUrl,
      "",
      "If you did not request a password reset, please ignore this email.",
    ].join("\n"),
    html: htmlContent,
  });

  return { skipped: false, recipient: email };
};
