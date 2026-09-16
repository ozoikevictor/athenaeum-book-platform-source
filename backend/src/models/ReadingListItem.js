const mongoose = require("mongoose");

const readingListItemSchema = new mongoose.Schema(
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
      required: true
    },
    status: {
      type: String,
      enum: ["Want to Read", "Currently Reading", "Finished"],
      default: "Want to Read"
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

readingListItemSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("ReadingListItem", readingListItemSchema);
