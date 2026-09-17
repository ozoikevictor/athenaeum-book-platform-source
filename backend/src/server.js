const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { listGenres, listRecommendations } = require("./controllers/bookController");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const { backfillPublicDomainReadingUrls } = require("./scripts/backfillPublicDomainReadingUrls");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Athenaeum backend API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "connecting"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/genres", listGenres);
app.get("/api/recommendations", listRecommendations);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === "MongoNetworkError" || error.name === "MongoServerSelectionError") {
    return res.status(503).json({
      message: "MongoDB is not reachable. Check your Atlas network access and connection string."
    });
  }

  res.status(500).json({ message: error.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

connectDB()
  .then(() => backfillPublicDomainReadingUrls({ apply: true, verify: false }))
  .catch((error) => {
    console.error("MongoDB startup task failed:", error.message);
  });
