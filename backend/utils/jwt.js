import jwt from "jsonwebtoken";

// ✅ ENV VALIDATION
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 10) {
  throw new Error("JWT secret missing or invalid");
}

export const generateToken = (user) => {
  if (!user || !user.id) {
    throw new Error("Invalid user data");
  }

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256",
      issuer: "lovecode-api", // ✅ your app name
      audience: "lovecode-users", // ✅ your users
    },
  );
};
