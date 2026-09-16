const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  { timestamps: true }
);

ratingSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
