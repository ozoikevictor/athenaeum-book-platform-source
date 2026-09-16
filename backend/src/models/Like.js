const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
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
    }
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
