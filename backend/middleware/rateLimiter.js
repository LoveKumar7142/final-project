const rateMap = new Map();

export const rateLimiter = (req, res, next) => {
  try {
    const ip = req.ip;
    const now = Date.now();

    if (!rateMap.has(ip)) {
      rateMap.set(ip, { count: 1, time: now });
      return next();
    }

    const data = rateMap.get(ip);

    // 1 minute window
    if (now - data.time < 60000) {
      if (data.count >= 50) {
        return res.status(429).json({ message: "Too many requests" });
      }
      data.count++;
    } else {
      // reset after 1 min
      rateMap.set(ip, { count: 1, time: now });
    }

    next();
  } catch (error) {
    console.error("RATE LIMIT ERROR:", error);
    next(); // fail-safe (block na kare server)
  }
};