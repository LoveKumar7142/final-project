import pool from "./backend/config/db.js";

async function run() {
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM projects");
    const hasSortOrder = columns.some(c => c.Field === "sort_order");
    console.log("hasSortOrder:", hasSortOrder);

    if (!hasSortOrder) {
      console.log("Adding sort_order column...");
      await pool.query("ALTER TABLE projects ADD COLUMN sort_order INT DEFAULT 0");
      console.log("Column added.");
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

run();
