const Book = require("../models/Book");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const Rating = require("../models/Rating");
const ReadingListItem = require("../models/ReadingListItem");
const { createSlug } = require("../utils/demoStore");

async function enrichBook(book, userId, readingItem = null, rating = null) {
  const [likeCount, commentCount, likedByUser] = await Promise.all([
    Like.countDocuments({ book: book._id }),
    Comment.countDocuments({ book: book._id, status: { $ne: "Hidden" } }),
    userId ? Like.exists({ user: userId, book: book._id }) : null
  ]);
  return formatBook(book, readingItem, rating, { likeCount, commentCount, likedByUser: Boolean(likedByUser) });
}

function formatBook(book, readingItem, rating, engagement = {}) {
  const plain = book.toObject ? book.toObject() : book;

  return {
    id: plain.slug,
    mongoId: plain._id?.toString(),
    title: plain.title,
    author: plain.author,
    genre: plain.genre,
    rating: plain.rating ?? 0,
    year: plain.year,
    pages: plain.pages,
    description: plain.description ?? "",
    reason: plain.reason ?? "Recommended for your shelf",
    tags: plain.tags ?? [],
    cover: plain.cover ?? "",
    readingType: plain.readingType ?? "none",
    readingUrl: plain.readingUrl ?? "",
    status: readingItem?.status,
    progress: readingItem?.progress,
    userRating: rating?.value,
    likeCount: engagement.likeCount ?? 0,
    commentCount: engagement.commentCount ?? 0,
    likedByUser: engagement.likedByUser ?? false
  };
}

async function getReaderItems(userId) {
  if (!userId) return new Map();

  const items = await ReadingListItem.find({ user: userId }).populate("book");
  return new Map(items.map((item) => [item.book?._id?.toString(), item]));
}

async function getReaderRatings(userId) {
  if (!userId) return new Map();

  const ratings = await Rating.find({ user: userId });
  return new Map(ratings.map((rating) => [rating.book.toString(), rating]));
}

async function getEngagementMap(books, userId) {
  const bookIds = books.map((book) => book._id);
  const [likes, comments, userLikes] = await Promise.all([
    Like.aggregate([{ $match: { book: { $in: bookIds } } }, { $group: { _id: "$book", count: { $sum: 1 } } }]),
    Comment.aggregate([{ $match: { book: { $in: bookIds }, status: { $ne: "Hidden" } } }, { $group: { _id: "$book", count: { $sum: 1 } } }]),
    userId ? Like.find({ user: userId, book: { $in: bookIds } }) : []
  ]);
  const likeCounts = new Map(likes.map((item) => [item._id.toString(), item.count]));
  const commentCounts = new Map(comments.map((item) => [item._id.toString(), item.count]));
  const likedByUser = new Set(userLikes.map((item) => item.book.toString()));

  return new Map(books.map((book) => {
    const id = book._id.toString();
    return [id, {
      likeCount: likeCounts.get(id) ?? 0,
      commentCount: commentCounts.get(id) ?? 0,
      likedByUser: likedByUser.has(id)
    }];
  }));
}

async function findBook(identifier) {
  const query = [{ slug: identifier }];

  if (/^[a-f\d]{24}$/i.test(identifier)) {
    query.push({ _id: identifier });
  }

  return Book.findOne({ $or: query });
}

async function listBooks(req, res) {
  const { search = "", genre = "All genres", sort = "Recommended" } = req.query;
  const query = search.toString().trim();
  const filter = {};

  if (genre !== "All genres") filter.genre = genre;

  if (query) {
    filter.$or = [
      { title: new RegExp(query, "i") },
      { author: new RegExp(query, "i") },
      { genre: new RegExp(query, "i") }
    ];
  }

  const sortMap = {
    "Highest Rated": { rating: -1 },
    Newest: { year: -1, createdAt: -1 },
    Popular: { rating: -1, title: 1 },
    Recommended: { title: 1 }
  };
  const books = await Book.find(filter).sort(sortMap[sort] || sortMap.Recommended);
  const readingItems = await getReaderItems(req.user?._id);
  const ratings = await getReaderRatings(req.user?._id);

  const engagement = await getEngagementMap(books, req.user?._id);
  const formatted = books.map((book) => {
    const id = book._id.toString();
    return formatBook(book, readingItems.get(id), ratings.get(id), engagement.get(id));
  });

  res.json({
    books: formatted,
    count: books.length
  });
}

async function listGenres(req, res) {
  const genres = await Book.distinct("genre");
  res.json({ genres: ["All genres", ...genres.filter(Boolean).sort()] });
}

async function listFeaturedBooks(req, res) {
  const books = await Book.find().sort({ rating: -1 }).limit(5);
  const engagement = await getEngagementMap(books);
  const formatted = books.map((book) => formatBook(book, null, null, engagement.get(book._id.toString())));
  res.json({ books: formatted });
}

async function listRecommendations(req, res) {
  const books = await Book.find().sort({ rating: -1, createdAt: -1 }).limit(4);
  const engagement = await getEngagementMap(books);
  const formatted = books.map((book) => formatBook(book, null, null, engagement.get(book._id.toString())));
  res.json({ books: formatted });
}

async function getBookById(req, res) {
  const book = await findBook(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const readingItem = req.user?._id ? await ReadingListItem.findOne({ user: req.user._id, book: book._id }) : null;
  const rating = req.user?._id ? await Rating.findOne({ user: req.user._id, book: book._id }) : null;

  return res.json({ book: await enrichBook(book, req.user?._id, readingItem, rating) });
}

async function getReadingContent(req, res) {
  const book = await findBook(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (book.readingType !== "text" || !book.readingUrl) {
    return res.status(400).json({ message: "This book does not have an in-app text source" });
  }

  let source;
  try {
    source = new URL(book.readingUrl);
  } catch {
    return res.status(400).json({ message: "The reading source URL is invalid" });
  }
  const allowedHosts = ["gutenberg.org", "www.gutenberg.org"];
  if (source.protocol !== "https:" || !allowedHosts.includes(source.hostname)) {
    return res.status(400).json({ message: "In-app text currently supports Project Gutenberg HTTPS links" });
  }

  const response = await fetch(source, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) return res.status(502).json({ message: "The reading source could not be loaded" });
  const content = await response.text();
  if (content.length > 5_000_000) return res.status(413).json({ message: "This text is too large for the reader" });
  return res.json({ title: book.title, author: book.author, content });
}

async function createBook(req, res) {
  const { title, author, genre, description, cover, year, pages, tags = [], reason, readingType = "none", readingUrl = "" } = req.body;
  const cleanTitle = title?.trim();
  const cleanAuthor = author?.trim();

  if (!cleanTitle || !cleanAuthor) {
    return res.status(400).json({ message: "Title and author are required" });
  }
  if (readingUrl && !/^https?:\/\//i.test(readingUrl)) {
    return res.status(400).json({ message: "Reading URL must begin with http:// or https://" });
  }

  const baseSlug = createSlug(cleanTitle);
  let slug = baseSlug;
  let suffix = 1;

  while (await Book.exists({ slug })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const book = await Book.create({
    slug,
    title: cleanTitle,
    author: cleanAuthor,
    genre: genre?.trim() || "Literary",
    description: description?.trim() || "",
    cover: cover?.trim() || "",
    year,
    pages,
    tags: Array.isArray(tags) ? tags : tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    rating: Number(req.body.rating ?? 0),
    reason: reason?.trim() || "Recommended for your shelf",
    readingType: ["text", "pdf", "external"].includes(readingType) ? readingType : "none",
    readingUrl: readingUrl?.trim() || ""
  });

  return res.status(201).json({ message: "Book created", book: formatBook(book) });
}

async function updateBook(req, res) {
  const book = await findBook(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  if (req.body.readingUrl && !/^https?:\/\//i.test(req.body.readingUrl)) {
    return res.status(400).json({ message: "Reading URL must begin with http:// or https://" });
  }

  Object.assign(book, {
    ...req.body,
    readingType: ["none", "text", "pdf", "external"].includes(req.body.readingType)
      ? req.body.readingType
      : book.readingType,
    readingUrl: req.body.readingUrl?.trim?.() ?? book.readingUrl,
    tags: Array.isArray(req.body.tags)
      ? req.body.tags
      : typeof req.body.tags === "string"
        ? req.body.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : book.tags
  });
  await book.save();

  return res.json({ message: "Book updated", book: formatBook(book) });
}

async function deleteBook(req, res) {
  const book = await findBook(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  await Promise.all([
    Comment.deleteMany({ book: book._id }),
    Like.deleteMany({ book: book._id }),
    Rating.deleteMany({ book: book._id }),
    ReadingListItem.deleteMany({ book: book._id })
  ]);
  await book.deleteOne();
  return res.json({ message: "Book deleted" });
}

async function rateBook(req, res) {
  const book = await findBook(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const rating = Number(req.body.rating ?? req.body.value ?? book.rating);

  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  await Rating.findOneAndUpdate(
    { user: req.user._id, book: book._id },
    { value: rating },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const result = await Rating.aggregate([
    { $match: { book: book._id } },
    { $group: { _id: "$book", average: { $avg: "$value" } } }
  ]);
  book.rating = result[0]?.average ? Number(result[0].average.toFixed(1)) : rating;
  await book.save();
  return res.json({ message: "Rating saved", book: formatBook(book, null, { value: rating }) });
}

async function toggleLike(req, res) {
  const book = await findBook(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const existing = await Like.findOne({ user: req.user._id, book: book._id });

  if (existing) {
    await existing.deleteOne();
    return res.json({ message: "Book unliked", liked: false, likeCount: await Like.countDocuments({ book: book._id }) });
  }

  await Like.create({ user: req.user._id, book: book._id });
  return res.status(201).json({ message: "Book liked", liked: true, likeCount: await Like.countDocuments({ book: book._id }) });
}

async function listBookComments(req, res) {
  const book = await findBook(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const comments = await Comment.find({ book: book._id, status: { $ne: "Hidden" } })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({
    comments: comments.map((comment) => ({
      id: comment._id.toString(),
      text: comment.text,
      status: comment.status,
      user: comment.user?.name ?? "Reader",
      createdAt: comment.createdAt
    }))
  });
}

async function createComment(req, res) {
  const book = await findBook(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!req.body.text?.trim()) {
    return res.status(400).json({ message: "Comment is required" });
  }

  const comment = await Comment.create({
    user: req.user._id,
    book: book._id,
    text: req.body.text
  });
  await comment.populate("user", "name email");

  return res.status(201).json({
    message: "Comment posted",
    comment: {
      id: comment._id.toString(),
      text: comment.text,
      status: comment.status,
      user: comment.user?.name ?? "Reader",
      createdAt: comment.createdAt
    }
  });
}

async function saveBook(req, res) {
  const book = await findBook(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const item = await ReadingListItem.findOneAndUpdate(
    { user: req.user._id, book: book._id },
    {
      status: req.body.status ?? "Want to Read",
      progress: req.body.progress ?? 0
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate("book");

  return res.status(201).json({
    message: "Book saved",
    readingListItem: { id: item._id.toString(), status: item.status, progress: item.progress, book: formatBook(item.book, item) }
  });
}

module.exports = {
  createBook,
  deleteBook,
  getBookById,
  getReadingContent,
  listBooks,
  listFeaturedBooks,
  listGenres,
  listRecommendations,
  listBookComments,
  rateBook,
  saveBook,
  toggleLike,
  createComment,
  updateBook
};
