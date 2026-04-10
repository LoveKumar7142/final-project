import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/jwt.js";

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const generatePasswordResetToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, type: "password-reset" },
    `${process.env.JWT_SECRET}${user.password}`,
    { expiresIn: "15m" },
  );

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail],
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), normalizedEmail, hashedPassword],
    );

    const [users] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [result.insertId],
    );

    const user = users[0];

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail],
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = users[0];
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

export const getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
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

    const normalizedEmail = email.trim().toLowerCase();
    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const user = users[0];
    const resetToken = generatePasswordResetToken(user);

    res.json({
      message: "Password reset link generated successfully",
      resetToken,
      resetUrl: `/reset-password/${user.id}/${resetToken}`,
      userId: user.id,
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

    const [users] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}${user.password}`);

    if (decoded.type !== "password-reset" || Number(decoded.id) !== Number(userId)) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Reset link is invalid or expired" });
  }
};

