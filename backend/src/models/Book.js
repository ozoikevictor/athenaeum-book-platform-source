const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    genre: {
      type: String,
      default: "Literary",
      trim: true
    },
    rating: {
      type: Number,
      default: 0
    },
    year: Number,
    pages: Number,
    description: {
      type: String,
      default: ""
    },
    reason: {
      type: String,
      default: "Recommended for your shelf"
    },
    tags: {
      type: [String],
      default: []
    },
    cover: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
