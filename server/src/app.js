const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const pointsRoutes = require("./routes/points.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const eventRoutes = require("./routes/event.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const spotRoutes = require("./routes/spot.routes");
const calendarRoutes = require("./routes/calendar.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// --- CORS configuration (allows localhost and the deployed frontend) ---
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL, // set this in Render to your Vercel URL (e.g., https://studyden.vercel.app)
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
// -------------------------------------------------------------


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // THIS IS NEEDED for x-www-form-urlencoded why?
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use("/api/calendar", calendarRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/spots", spotRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;