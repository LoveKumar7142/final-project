import v8 from "v8";
v8.setFlagsFromString("--max-old-space-size=4096 --no-wasm-tier-up");

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import testDB from "./config/testDb.js";

import authRoutes from "./routes/public/authRoutes.js";
import projectRoutes from "./routes/public/projectRoutes.js";
import uploadRoutes from "./routes/_x9f_protected_core/uploadRoutes.js";
import agreementRoutes from "./routes/public/agreementRoutes.js";
import downloadRoutes from "./routes/public/downloadRoutes.js";
import paymentRoutes from "./routes/public/paymentRoutes.js";
import orderRoutes from "./routes/_x9f_protected_core/orderRoutes.js";
import adminRoutes from "./routes/_x9f_protected_core/adminRoutes.js";
import contactRoutes from "./routes/public/contactRoutes.js";
import contentRoutes from "./routes/public/contentRoutes.js";
import consentRoutes from "./routes/public/consentRoutes.js";

import { protect } from "./middleware/authMiddleware.js";
import { isAdmin } from "./middleware/adminMiddleware.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

// ✅ PORT VALIDATION
const PORT = Number(process.env.PORT) || 5000;
if (!PORT || PORT < 1000) {
  throw new Error("Invalid PORT");
}

// ✅ Trust proxy (important for hosting)
app.set("trust proxy", 1);

// ================= SECURITY =================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // APIs only
  }),
);

// ================= COMPRESSION =================
app.use(compression());

// ================= CORS =================
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAllOrigins = allowedOrigins.length === 0;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => origin === allowed);

      if (allowAllOrigins || isAllowed) {
        return callback(null, true);
      }

      console.warn("❌ Blocked Origin:", origin);
      return callback(null, false); // ❗ safe block
    },
    credentials: true,
  }),
);

// ================= BODY =================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ================= DEBUG (DEV ONLY) =================
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`👉 ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ================= RATE LIMIT =================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);

// ================= 🔐 DOMAIN CHECK =================
const domainCheck = (req, res, next) => {
  const allowedHosts = ["lovecode.icu", "www.lovecode.icu"];

  const host =
    req.headers["x-forwarded-host"] || req.headers.host;

  if (process.env.NODE_ENV === "development") {
    return next();
  }

  if (!host || !allowedHosts.some((h) => host.includes(h))) {
    return res.status(403).json({
      message: "Forbidden - Only domain access allowed",
    });
  }

  next();
};
// ================= ROUTES =================

// 🔹 ROOT
app.get("/", (req, res) => {
  res.send("<h1>🚀 Backend Running Successfully</h1>");
});

// 🔹 HEALTH CHECK
app.get("/health", (req, res) => {
  res.send("OK");
});

// 🔹 API CHECK
app.get("/api", (req, res) => {
  res.json({ message: "API is running..." });
});

// ================= PUBLIC ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/consent", consentRoutes);

// ================= USER ROUTES =================
app.use("/api/upload", protect, uploadRoutes);
app.use("/api/agreement", protect, agreementRoutes);
app.use("/api/download", protect, downloadRoutes);
app.use("/api/payment", protect, paymentRoutes);
app.use("/api/orders", protect, orderRoutes);

// ================= ADMIN ROUTES =================
app.use("/api/admin", protect, isAdmin, adminRoutes);

app.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = "https://lovecode.icu";

    // 🔥 Static pages
    const staticPages = [
      "",
      "/hire-me",
      "/services",
      "/projects",
      "/contact",
      "/about",
    ];

    // 🔥 Dynamic pages (future use - projects/blog)
    // abhi empty rakh sakte ho
    const dynamicPages = [];

    const allPages = [...staticPages, ...dynamicPages];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    allPages.forEach((page) => {
      sitemap += `
                  <url>
                    <loc>${baseUrl}${page}</loc>
                    <lastmod>${new Date().toISOString()}</lastmod>
                    <changefreq>weekly</changefreq>
                    <priority>${page === "" ? "1.0" : "0.8"}</priority>
                  </url>
                `;
    });

    sitemap += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap Error:", error);
    res.status(500).end();
  }
});

// ================= ERROR HANDLING =================
app.use(notFound);
app.use(errorHandler);

// ================= START SERVER =================
const startServer = async () => {
  try {
    // const dbConnected = await testDB();

    // if (!dbConnected) {
    //   throw new Error("Database not connected");
    // }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed:", error.message);
    process.exit(1); // ❗ crash safely
  }
};

startServer();
