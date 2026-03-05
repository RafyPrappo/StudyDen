const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const {
  register,
  login,
  me,
  logout,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", logout);

module.exports = router;