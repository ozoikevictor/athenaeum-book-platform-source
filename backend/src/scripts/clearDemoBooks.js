const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Book = require("../models/Book");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const Rating = require("../models/Rating");
const ReadingListItem = require("../models/ReadingListItem");
const { books: seedBooks } = require("../data");

dotenv.config();

async function main() {
  await connectDB();

  const demoSlugs = seedBooks.map((book) => book.id);
  const demoBooks = await Book.find({ slug: { $in: demoSlugs } }).select("_id title");
  const demoBookIds = demoBooks.map((book) => book._id);

  if (!demoBookIds.length) {
    console.log("No demo books found.");
    return;
  }

  await Promise.all([
    Comment.deleteMany({ book: { $in: demoBookIds } }),
    Like.deleteMany({ book: { $in: demoBookIds } }),
    Rating.deleteMany({ book: { $in: demoBookIds } }),
    ReadingListItem.deleteMany({ book: { $in: demoBookIds } })
  ]);

  await Book.deleteMany({ _id: { $in: demoBookIds } });
  console.log(`Removed ${demoBooks.length} demo books.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
