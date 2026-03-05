import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

function setTokenCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user", // Default role
      points: 0,
      badges: []
    });

    const token = signToken({ id: user._id.toString(), email: user.email });
    setTokenCookie(res, token);

    res.status(201).json({
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        points: user.points,
        badges: user.badges
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: user._id.toString(), email: user.email });
    setTokenCookie(res, token);

    res.json({
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        points: user.points,
        badges: user.badges
      },
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("_id name email role points badges");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
  res.json({ ok: true });
};