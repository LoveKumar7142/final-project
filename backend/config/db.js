import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ✅ ENV VALIDATION
if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME
) {
  throw new Error("Database environment variables missing");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
  queueLimit: 0,

  // 🔐 Security + Stability
  connectTimeout: 10000,
  decimalNumbers: true,
  multipleStatements: false,

  // 🔐 SSL (important for production hosting)
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
