const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

mongoose.set("bufferCommands", false);

async function connectDB() {
  const mongoUrl = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI;

  if (!mongoUrl) {
    throw new Error("MONGO_URI is missing from backend/.env");
  }

  const connectPromise = mongoose.connect(mongoUrl, {
    connectTimeoutMS: 10000,
    family: 4,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000
  });

  await Promise.race([
    connectPromise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("MongoDB connection timed out after 10 seconds")), 10000);
    })
  ]);
  console.log("MongoDB connected");
}

module.exports = connectDB;
