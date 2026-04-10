import pool from "./db.js";

const testDB = async () => {
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);
  }
};

export default testDB;
