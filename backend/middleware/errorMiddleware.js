export const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  const statusCode = err.statusCode || res.statusCode || 500;
  const normalizedStatus = statusCode >= 400 ? statusCode : 500;
  const payload = {
    message: err.message || "Server Error",
  };

  if (err.details) {
    payload.details = err.details;
  }

  res.status(normalizedStatus).json(payload);
};

export const notFound = (req, res, next) => {
  res.status(404);
  throw new Error("Route not found");
};
