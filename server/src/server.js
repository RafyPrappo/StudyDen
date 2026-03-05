import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from 'node:dns/promises';
import authRoutes from "./routes/auth.routes.js";

// FORCE DNS SERVERS
try {
  dns.setServers(["1.1.1.1", "8.8.8.8", "8.8.4.4"]);
  console.log("DNS servers set to Cloudflare and Google");
} catch (err) {
  console.error("Failed to set DNS servers:", err.message);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    console.log("Please check:");
    console.log("   1. Your IP is whitelisted in MongoDB Atlas");
    console.log("   2. Your username and password are correct");
    console.log("   3. Your network isn't blocking MongoDB");
    process.exit(1);
  }
};

connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Test route
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});