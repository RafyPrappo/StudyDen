const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

module.exports = async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token" });
  }

  try {
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.id).select("_id email role");
    if (!user) {
      res.clearCookie("token", { 
        httpOnly: true, 
        sameSite: "lax", 
        secure: false,
        path: "/"
      });
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    next();
  } catch (e) {
    res.clearCookie("token", { 
      httpOnly: true, 
      sameSite: "lax", 
      secure: false,
      path: "/"
    });
    return res.status(401).json({ message: "Invalid token" });
  }
};