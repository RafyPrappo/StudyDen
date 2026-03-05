import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import {
  register,
  login,
  me,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", logout);

export default router;