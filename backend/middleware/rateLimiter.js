const rateMap = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 50;

const cleanupTimer = setInterval(() => {
  const now = Date.now();

  for (const [ip, data] of rateMap.entries()) {
    if (now - data.time >= WINDOW_MS) {
      rateMap.delete(ip);
    }
  }
}, WINDOW_MS);

cleanupTimer.unref();

export const rateLimiter = (req, res, next) => {
  try {
    const ip = req.ip;
    const now = Date.now();

    if (!rateMap.has(ip)) {
      rateMap.set(ip, { count: 1, time: now });
      return next();
    }

    const data = rateMap.get(ip);

    if (now - data.time < WINDOW_MS) {
      if (data.count >= MAX_REQUESTS) {
        return res.status(429).json({ message: "Too many requests" });
      }
      data.count++;
    } else {
      rateMap.set(ip, { count: 1, time: now });
    }

    next();
  } catch (error) {
    console.error("RATE LIMIT ERROR:", error);
    next(); // fail-safe (block na kare server)
  }
};
