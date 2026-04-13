import pool from "./db.js";

const testDB = async () => {
  try {
    await pool.query("SELECT 1");

    console.log("✅ Database connected successfully");

    return true; // ✅ success signal
  } catch (error) {
    console.error("DB CONNECTION ERROR:", error);

    return false; // ❌ failure signal
  }
};

export default testDB;
