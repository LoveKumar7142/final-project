const HEAVY_PATHS = [
  "/api/auth/firebase",
  "/api/payment",
  "/api/orders",
  "/api/download",
];

const shouldTraceRequest = (req) => {
  if (process.env.TRACE_REQUESTS === "true") {
    return true;
  }

  return HEAVY_PATHS.some((path) => req.originalUrl.startsWith(path));
};

const formatMemory = () => {
  const { rss, heapUsed, heapTotal, external } = process.memoryUsage();

  return {
    rssMb: Math.round((rss / 1024 / 1024) * 10) / 10,
    heapUsedMb: Math.round((heapUsed / 1024 / 1024) * 10) / 10,
    heapTotalMb: Math.round((heapTotal / 1024 / 1024) * 10) / 10,
    externalMb: Math.round((external / 1024 / 1024) * 10) / 10,
  };
};

export const requestMonitor = (req, res, next) => {
  if (!shouldTraceRequest(req)) {
    return next();
  }

  const startedAt = Date.now();
  const before = formatMemory();

  res.on("finish", () => {
    const after = formatMemory();
    const durationMs = Date.now() - startedAt;

    console.log(
      `[REQ] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${durationMs}ms`,
      {
        before,
        after,
      },
    );
  });

  next();
};
