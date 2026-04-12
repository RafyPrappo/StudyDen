require("dotenv").config();
const mongoose = require("mongoose");
const dns = require('node:dns/promises');
const app = require("./app");

// Force DNS servers
try {
  dns.setServers(["1.1.1.1", "8.8.8.8", "8.8.4.4"]);
  console.log("DNS servers set to Cloudflare and Google");
} catch (err) {
  console.error("Failed to set DNS servers:", err.message);
}

const PORT = process.env.PORT || 9120;

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
    process.exit(1);
  }
};

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});