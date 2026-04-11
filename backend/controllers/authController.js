import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/jwt.js";
import { verifyFirebaseToken } from "../config/firebaseAdmin.js";
import { sendOtpVerificationEmail, sendPasswordResetEmail } from "../utils/mailer.js";

const OTP_EXPIRY_MINUTES = 10;

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  auth_provider: user.auth_provider,
  email_verified: Boolean(user.email_verified),
});

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const generatePasswordResetToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, type: "password-reset" },
    `${process.env.JWT_SECRET}${user.password}`,
    { expiresIn: "15m" },
  );

const createOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const getOtpExpiryDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + OTP_EXPIRY_MINUTES);
  return date;
};

const requestRegistrationOtp = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!name?.trim() || !normalizedEmail || !password) {
    const error = new Error("Name, email, and password are required");
    error.statusCode = 400;
    throw error;
  }

  const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
  if (existingUsers.length > 0) {
    const error = new Error("User already exists");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otpCode = createOtpCode();
  const expiresAt = getOtpExpiryDate();

  await pool.query(
    `INSERT INTO email_verifications (name, email, password_hash, otp_code, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       otp_code = VALUES(otp_code),
       expires_at = VALUES(expires_at),
       verified_at = NULL`,
    [name.trim(), normalizedEmail, hashedPassword, otpCode, expiresAt],
  );

  await sendOtpVerificationEmail({
    name: name.trim(),
    email: normalizedEmail,
    otpCode,
  });

  return normalizedEmail;
};

export const registerUser = async (req, res) => {
  try {
    const normalizedEmail = await requestRegistrationOtp(req.body);
    res.status(200).json({
      message: `OTP sent successfully. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
      email: normalizedEmail,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const resendRegistrationOtp = async (req, res) => {
  try {
    const normalizedEmail = await requestRegistrationOtp(req.body);
    res.status(200).json({
      message: "OTP resent successfully",
      email: normalizedEmail,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const otpCode = String(req.body.otp || "").trim();

    if (!normalizedEmail || !otpCode) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const [pendingRows] = await pool.query(
      "SELECT * FROM email_verifications WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (pendingRows.length === 0) {
      return res.status(404).json({ message: "No pending verification found for this email" });
    }

    const pending = pendingRows[0];
    const expiryTime = new Date(pending.expires_at).getTime();

    if (pending.verified_at) {
      return res.status(400).json({ message: "This email is already verified" });
    }

    if (Date.now() > expiryTime) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    if (pending.otp_code !== otpCode) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, auth_provider, email_verified)
       VALUES (?, ?, ?, 'user', 'local', TRUE)`,
      [pending.name, pending.email, pending.password_hash],
    );

    await pool.query("DELETE FROM email_verifications WHERE email = ?", [normalizedEmail]);

    const [users] = await pool.query(
      "SELECT id, name, email, role, auth_provider, email_verified FROM users WHERE id = ?",
      [result.insertId],
    );

    const user = users[0];

    res.status(201).json({
      message: "Email verified and account created successfully",
      token: generateToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "User already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    if (!user.password) {
      return res.status(400).json({ message: "Use your social login provider for this account" });
    }

    if (!user.email_verified) {
      return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const firebaseLogin = async (req, res) => {
  try {
    const { idToken, provider } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required" });
    }

    const decodedToken = await verifyFirebaseToken(idToken);
    const email = normalizeEmail(decodedToken.email);
    const name = decodedToken.name?.trim() || email.split("@")[0];
    const firebaseUid = decodedToken.uid;
    const authProvider = provider || decodedToken.firebase?.sign_in_provider || "firebase";

    if (!email) {
      return res.status(400).json({ message: "Firebase account email is missing" });
    }

    if (!decodedToken.email_verified) {
      return res.status(403).json({ message: "Please verify your email in Firebase first" });
    }

    const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);

    if (existingUsers.length === 0) {
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, firebase_uid, auth_provider, email_verified, role)
         VALUES (?, ?, NULL, ?, ?, TRUE, 'user')`,
        [name, email, firebaseUid, authProvider],
      );

      const [createdUsers] = await pool.query(
        "SELECT id, name, email, role, auth_provider, email_verified FROM users WHERE id = ?",
        [result.insertId],
      );

      const createdUser = createdUsers[0];
      return res.json({
        message: "Firebase login successful",
        token: generateToken(createdUser),
        user: sanitizeUser(createdUser),
      });
    }

    const existingUser = existingUsers[0];
    await pool.query(
      `UPDATE users
       SET name = ?, firebase_uid = ?, auth_provider = ?, email_verified = TRUE
       WHERE id = ?`,
      [existingUser.name || name, firebaseUid, authProvider, existingUser.id],
    );

    const [updatedUsers] = await pool.query(
      "SELECT id, name, email, role, auth_provider, email_verified FROM users WHERE id = ?",
      [existingUser.id],
    );

    const updatedUser = updatedUsers[0];

    res.json({
      message: "Firebase login successful",
      token: generateToken(updatedUser),
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, auth_provider, email_verified FROM users WHERE id = ?",
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: sanitizeUser(users[0]) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

    if (users.length === 0) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const user = users[0];

    if (!user.password) {
      return res.status(400).json({ message: "Password reset is only available for email/password accounts" });
    }

    const resetToken = generatePasswordResetToken(user);

    const clientOrigin = (process.env.CLIENT_ORIGIN || "").split(",")[0].trim() || "https://lovecode.icu";
    const fullResetUrl = `${clientOrigin}/reset-password/${user.id}/${resetToken}`;

    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      resetUrl: fullResetUrl,
    });

    res.json({
      message: "Password reset link has been sent to your email successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId, token, password } = req.body;

    if (!userId || !token || !password) {
      return res.status(400).json({ message: "User, token, and new password are required" });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    if (!user.password) {
      return res.status(400).json({ message: "Password reset is only available for email/password accounts" });
    }

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}${user.password}`);

    if (decoded.type !== "password-reset" || Number(decoded.id) !== Number(userId)) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Reset link is invalid or expired" });
  }
};
