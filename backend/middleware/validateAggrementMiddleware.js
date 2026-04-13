export const validateAgreement = (req, res, next) => {
  const projectId = Number(req.body.project_id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  next();
};