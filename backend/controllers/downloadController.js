import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import https from "https";
import http from "http";

export const generateDownloadUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const [projects] = await pool.query("SELECT * FROM projects WHERE id = ?", [
      projectId,
    ]);

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

    // const token = jwt.sign(
    //   { fileUrl: project.file, fileName: project.file_name || `${project.slug}.zip` },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "5m" } // 5 minutes expiry
    // );
    const token = jwt.sign(
      {
        projectId: project.id,
        userId: userId, // ✅ bind to user
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" },
    );

    const signedUrl = `/api/download/serve?token=${token}`;

    res.json({
      message: "Download generated successfully",
      signedUrl,
      download_count: (project.download_count || 0) + 1,
    });
  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const serveProxyDownload = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) return res.status(401).send("Missing token");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { projectId, userId } = decoded;
    // ✅ Verify user matches token
    if (req.user && req.user.id !== userId) {
      return res.status(403).send("Unauthorized access");
    }

    const [projects] = await pool.query(
      "SELECT file, file_name FROM projects WHERE id = ?",
      [projectId],
    );

    if (projects.length === 0) {
      return res.status(404).send("Project not found");
    }

    const fileUrl = projects[0].file;
    // ✅ Allow only trusted domains
    if (!fileUrl.startsWith("https://") && !fileUrl.startsWith("http://")) {
      return res.status(400).send("Invalid file URL");
    }
    const fileName = projects[0].file_name;

    const transport = fileUrl.startsWith("https") ? https : http;

    const request = transport.get(fileUrl, (proxyRes) => {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.setHeader(
        "Content-Type",
        proxyRes.headers["content-type"] || "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-store");

      proxyRes.pipe(res);
    });

    // ✅ handle errors
    request.on("error", (err) => {
      console.error("STREAM ERROR:", err);
      res.status(500).send("Download failed");
    });
  } catch (error) {
    res.status(401).send("Invalid or expired link");
  }
};
