import v8 from "v8";
v8.setFlagsFromString('--max-old-space-size=4096 --no-wasm-tier-up');

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import testDB from "./config/testDb.js";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import agreementRoutes from "./routes/agreementRoutes.js";
import downloadRoutes from "./routes/downloadRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";

import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

// ✅ Trust proxy (important for cPanel)
app.set("trust proxy", 1);

// ✅ Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ✅ Compression
app.use(compression());

// ================= CORS FIX =================
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAllOrigins = allowedOrigins.length === 0;

app.use(
  cors({
    origin(origin, callback) {
      // allow server-to-server or tools like Postman
      if (!origin) return callback(null, true);

      // 🔥 strict exact match (IMPORTANT FIX)
      const isAllowed = allowedOrigins.some((allowed) =>
        origin === allowed
      );

      if (allowAllOrigins || isAllowed) {
        return callback(null, true);
      }

      console.log("❌ Blocked Origin:", origin);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

// ================= BODY =================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ================= DEBUG =================
app.use((req, res, next) => {
  console.log(`👉 ${req.method} ${req.originalUrl}`);
  next();
});

// ================= RATE LIMIT =================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);

// ================= ROUTES =================

// ✅ Root
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// ✅ /api
app.get("/api", (req, res) => {
  res.json({ message: "API is running..." });
});

// ✅ API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/agreement", agreementRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);

// ================= ERROR =================
app.use(notFound);
app.use(errorHandler);

// ================= START =================
const PORT = process.env.PORT;

const startServer = async () => {
  try {
    // 🔥 optional: enable after testing
    await testDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed:", error.message);
  }
};

startServer();