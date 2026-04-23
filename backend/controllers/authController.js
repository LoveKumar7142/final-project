import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/jwt.js";

const OTP_EXPIRY_MINUTES = 10;
const loadMailer = async () => import("../utils/mailer.js");
const loadFirebaseAuth = async () => import("../config/firebaseAdmin.js");

// ================= HELPERS =================
const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  auth_provider: user.auth_provider,
  email_verified: Boolean(user.email_verified),
});

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

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

// ================= REGISTER =================
const requestRegistrationOtp = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!name?.trim() || !normalizedEmail || !password) {
    throw new Error("Name, email and password are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
    normalizedEmail,
  ]);

  if (existing.length > 0) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otpCode = createOtpCode();
  const expiresAt = getOtpExpiryDate();

  await pool.query(
    `INSERT INTO email_verifications (name, email, password_hash, otp_code, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     name=VALUES(name),
     password_hash=VALUES(password_hash),
     otp_code=VALUES(otp_code),
     expires_at=VALUES(expires_at),
     verified_at=NULL`,
    [name.trim(), normalizedEmail, hashedPassword, otpCode, expiresAt],
  );

  const { sendOtpVerificationEmail } = await loadMailer();

  await sendOtpVerificationEmail({
    name: name.trim(),
    email: normalizedEmail,
    otpCode,
  });

  return normalizedEmail;
};

export const registerUser = async (req, res) => {
  try {
    const email = await requestRegistrationOtp(req.body);
    res.json({
      message: "OTP sent successfully",
      email,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resendRegistrationOtp = async (req, res) => {
  try {
    const email = await requestRegistrationOtp(req.body);
    res.json({ message: "OTP resent successfully", email });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    const [rows] = await pool.query(
      "SELECT * FROM email_verifications WHERE email = ?",
      [email],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No OTP found" });
    }

    const data = rows[0];

    if (Date.now() > new Date(data.expires_at)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ✅ OTP attempt limit check (ADD ABOVE OTP MATCH)
    if (data.otp_attempts >= 5) {
      return res.status(429).json({ message: "Too many attempts. Try later" });
    }

    // ❌ Wrong OTP
    if (data.otp_code !== otp) {
      await pool.query(
        "UPDATE email_verifications SET otp_attempts = otp_attempts + 1 WHERE email=?",
        [email],
      );

      return res.status(400).json({ message: "Invalid OTP" });
    }
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, auth_provider, email_verified)
       VALUES (?, ?, ?, 'user', 'local', TRUE)`,
      [data.name, data.email, data.password_hash],
    );

    await pool.query("DELETE FROM email_verifications WHERE email = ?", [
      email,
    ]);

    const [users] = await pool.query(
      "SELECT id,name,email,role,auth_provider,email_verified FROM users WHERE id=?",
      [result.insertId],
    );

    const user = users[0];

    res.json({
      message: "Account created",
      token: generateToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      normalizeEmail(email),
    ]);

    if (!users.length) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // ✅ Check lock
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(403).json({ message: "Account locked. Try later" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      const attempts = user.login_attempts + 1;

      await pool.query(
        "UPDATE users SET login_attempts=?, lock_until=? WHERE id=?",
        [
          attempts,
          attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
          user.id,
        ],
      );

      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Reset attempts after success
    await pool.query(
      "UPDATE users SET login_attempts=0, lock_until=NULL, last_login=NOW() WHERE id=?",
      [user.id],
    );

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================= FIREBASE =================
export const firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    const { verifyFirebaseToken } = await loadFirebaseAuth();
    const decoded = await verifyFirebaseToken(idToken);

    if (!decoded.email) {
      return res.status(400).json({ message: "Invalid Firebase token" });
    }
    const email = normalizeEmail(decoded.email);
    const name = decoded.name || email.split("@")[0];

    const [users] = await pool.query("SELECT * FROM users WHERE email=?", [
      email,
    ]);

    if (!users.length) {
      const [result] = await pool.query(
        `INSERT INTO users (name,email,auth_provider,email_verified,role)
         VALUES (?,?, 'firebase',TRUE,'user')`,
        [name, email],
      );

      const [created] = await pool.query(
        "SELECT id,name,email,role,auth_provider,email_verified FROM users WHERE id=?",
        [result.insertId],
      );

      return res.json({
        token: generateToken(created[0]),
        user: sanitizeUser(created[0]),
      });
    }

    res.json({
      token: generateToken(users[0]),
      user: sanitizeUser(users[0]),
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================= CURRENT USER =================
export const getCurrentUser = async (req, res) => {
  const [users] = await pool.query(
    "SELECT id,name,email,role,auth_provider,email_verified FROM users WHERE id=?",
    [req.user.id],
  );

  if (!users.length) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ user: sanitizeUser(users[0]) });
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const [users] = await pool.query("SELECT * FROM users WHERE email=?", [
      email,
    ]);

    if (!users.length) {
      return res.json({ message: "If account exists, email sent" });
    }

    const user = users[0];

    const token = generatePasswordResetToken(user);

    // ✅ Save token in DB
    await pool.query(
      "UPDATE users SET password_reset_token=?, password_reset_expiry=? WHERE id=?",
      [token, new Date(Date.now() + 15 * 60 * 1000), user.id],
    );

    // ✅ Send safe URL matching the React Router layout (/:userId/:token)
    const url = `${process.env.CLIENT_ORIGIN}/reset-password/${user.id}/${token}`;

    const { sendPasswordResetEmail } = await loadMailer();

    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      resetUrl: url,
    });

    res.json({ message: "Reset link sent" });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { userId, token, password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Weak password" });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE id=?", [
      userId,
    ]);

    if (!users.length) {
      return res.json({ message: "If account exists, email sent" });
    }

    const user = users[0];

    if (
      user.password_reset_token !== token ||
      new Date(user.password_reset_expiry) < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password=?, password_reset_token=NULL, password_reset_expiry=NULL WHERE id=?",
      [hashed, userId],
    );
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};
