const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

module.exports = async function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("_id email role");
    if (user) req.user = { id: user._id.toString(), email: user.email, role: user.role };
    next();
  } catch (e) { next(); }
};