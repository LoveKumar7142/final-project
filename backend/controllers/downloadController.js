import pool from "../config/db.js";

export const downloadProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const [projects] = await pool.query("SELECT * FROM projects WHERE id = ?", [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = projects[0];

    const [agreement] = await pool.query(
      "SELECT * FROM agreements WHERE user_id = ? AND project_id = ? AND accepted = TRUE",
      [userId, projectId],
    );

    if (agreement.length === 0) {
      return res.status(403).json({ message: "Accept agreement first" });
    }

    if (project.is_paid) {
      const [purchase] = await pool.query(
        "SELECT * FROM purchases WHERE user_id = ? AND project_id = ? AND payment_status = 'completed'",
        [userId, projectId],
      );

      if (purchase.length === 0) {
        return res.status(403).json({ message: "Payment required" });
      }
    }

    await pool.query(
      "UPDATE projects SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?",
      [projectId],
    );

    res.json({
      message: "Download allowed",
      file: project.file,
      file_name: project.file_name,
      download_count: (project.download_count || 0) + 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

