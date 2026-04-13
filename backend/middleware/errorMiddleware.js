export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode || 500;
  const normalizedStatus = statusCode >= 400 ? statusCode : 500;

  // ✅ Safe logging (dev vs prod)
  if (process.env.NODE_ENV === "development") {
    console.error("ERROR:", err.stack || err.message);
  } else {
    console.error("ERROR:", err.message);
  }

  const payload = {
    message:
      normalizedStatus === 500
        ? "Internal server error"
        : err.message || "Error",
  };

  // ✅ Only show details in development
  if (process.env.NODE_ENV === "development" && err.details) {
    payload.details = err.details;
  }

  res.status(normalizedStatus).json(payload);
};

// 🔹 404 handler
export const notFound = (req, res, next) => {
  res.status(404);

  const error = new Error("Route not found");
  error.statusCode = 404;

  next(error);
};
