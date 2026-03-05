import { verifyToken } from "../utils/jwt.js";

export default function requireAuth(req, res, next) {
  const cookieToken = req.cookies?.token;
  const header = req.headers.authorization || "";
  const headerToken = header.startsWith("Bearer ") ? header.slice(7) : null;

  const token = cookieToken || headerToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}