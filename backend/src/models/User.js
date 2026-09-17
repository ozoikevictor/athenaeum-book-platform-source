const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["User", "Admin"],
      default: "User"
    },
    books: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: "Active"
    },
    favoriteGenres: {
      type: [String],
      default: []
    },
    profileImage: {
      type: String,
      default: ""
    },
    readingPreferences: {
      weeklyRecommendations: { type: Boolean, default: true },
      newReleaseAlerts: { type: Boolean, default: true },
      communityActivity: { type: Boolean, default: false }
    },
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    passwordResetToken: {
      type: String,
      default: null
    },
    passwordResetExpires: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
