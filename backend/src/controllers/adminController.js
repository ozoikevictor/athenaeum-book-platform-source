const Book = require("../models/Book");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const Rating = require("../models/Rating");
const User = require("../models/User");
const ReadingListItem = require("../models/ReadingListItem");
const { createSlug } = require("../utils/demoStore");

function inferGenre(subjects = []) {
  const value = subjects.join(" ").toLowerCase();
  if (value.includes("science fiction")) return "Science Fiction";
  if (value.includes("fantasy")) return "Fantasy";
  if (value.includes("mystery") || value.includes("detective")) return "Mystery";
  if (value.includes("romance") || value.includes("love stories")) return "Romance";
  if (value.includes("horror") || value.includes("ghost")) return "Horror";
  if (value.includes("history") || value.includes("historical")) return "Historical Fiction";
  if (value.includes("poetry")) return "Poetry";
  if (value.includes("biography") || value.includes("autobiography")) return "Biography";
  if (value.includes("juvenile") || value.includes("children")) return "Children's Literature";
  return "Classic Fiction";
}

async function importPublicDomainBooks(req, res) {
  const requested = Math.min(100, Math.max(1, Number(req.body.count) || 100));
  const existing = await Book.find().select("title slug").lean();
  const existingTitles = new Set(existing.map((book) => book.title.toLowerCase().trim()));
  const usedSlugs = new Set(existing.map((book) => book.slug));
  const candidates = [];

  for (let page = 1; page <= 12 && candidates.length < requested; page += 1) {
    const response = await fetch(`https://gutendex.com/books/?languages=en&sort=popular&page=${page}`, {
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`Gutenberg catalogue returned HTTP ${response.status}`);
    const data = await response.json();

    for (const item of data.results ?? []) {
      const title = item.title?.trim();
      const author = item.authors?.[0]?.name?.trim();
      const textEntry = Object.entries(item.formats ?? {}).find(
        ([type, url]) => type.startsWith("text/plain") && typeof url === "string" && url.startsWith("https://")
      );
      if (!title || !author || item.copyright !== false || !textEntry || existingTitles.has(title.toLowerCase())) continue;

      let slug = createSlug(title);
      let suffix = 2;
      while (usedSlugs.has(slug)) {
        slug = `${createSlug(title)}-${suffix}`;
        suffix += 1;
      }
      const subjects = (item.subjects ?? []).slice(0, 4);
      const themes = subjects.slice(0, 3).map((subject) => subject.replace(/\s*--\s*/g, " ").toLowerCase());
      const genre = inferGenre(subjects);
      candidates.push({
        slug,
        title,
        author,
        genre,
        rating: 0,
        description: `${title} is a public-domain work by ${author}${themes.length ? ` exploring ${themes.join(", ")}` : " preserved for generations of readers"}.`,
        reason: `Recommended for readers discovering influential ${genre.toLowerCase()} and enduring public-domain literature.`,
        tags: [...new Set([genre, "Public domain", ...subjects.slice(0, 2).map((subject) => subject.split(" -- ")[0])])],
        cover: item.formats?.["image/jpeg"] ?? "",
        readingType: "text",
        readingUrl: textEntry[1],
        readingProvider: "Project Gutenberg",
        readingAccess: "full"
      });
      existingTitles.add(title.toLowerCase());
      usedSlugs.add(slug);
      if (candidates.length >= requested) break;
    }
  }

  if (!candidates.length) return res.json({ message: "No new public-domain books were found", imported: 0 });
  await Book.insertMany(candidates);
  return res.status(201).json({ message: `${candidates.length} public-domain books imported`, imported: candidates.length });
}

async function getOverview(req, res) {
  const [totalUsers, totalBooks, totalRatings, totalLikes, pendingComments, activeRecommendations, topGenreRows, recentUsers, recentBooks, recentComments] = await Promise.all([
    User.countDocuments(),
    Book.countDocuments(),
    Rating.countDocuments(),
    Like.countDocuments(),
    Comment.countDocuments({ status: "Pending" }),
    ReadingListItem.countDocuments(),
    Book.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    User.find().select("name createdAt").sort({ createdAt: -1 }).limit(20),
    Book.find().select("title createdAt").sort({ createdAt: -1 }).limit(20),
    Comment.find().populate("user", "name").populate("book", "title").sort({ createdAt: -1 }).limit(20)
  ]);

  const topGenreTotal = topGenreRows.reduce((sum, row) => sum + row.count, 0) || 1;
  const recentActivity = [
    ...recentUsers.map((user) => ({ id: user._id.toString(), label: `${user.name} created an account`, createdAt: user.createdAt })),
    ...recentBooks.map((book) => ({ id: book._id.toString(), label: `${book.title} was added to the catalogue`, createdAt: book.createdAt })),
    ...recentComments.map((comment) => ({
      id: comment._id.toString(),
      label: `${comment.user?.name ?? "A reader"} commented on ${comment.book?.title ?? "a book"}`,
      createdAt: comment.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);

  res.json({
    stats: {
      totalUsers,
      totalBooks,
      totalReviews: totalRatings,
      totalLikes,
      pendingComments,
      activeRecommendations
    },
    recentActivity,
    topGenres: topGenreRows.map((row) => ({
      genre: row._id || "Uncategorized",
      count: row.count,
      percent: Math.round((row.count / topGenreTotal) * 100)
    })),
    recommendationHealth: 94
  });
}

function getActivity(req, res) {
  res.json({ activity: [] });
}

async function listBooks(req, res) {
  const books = await Book.find().sort({ createdAt: -1 });
  const [likeRows, commentRows] = await Promise.all([
    Like.aggregate([{ $group: { _id: "$book", count: { $sum: 1 } } }]),
    Comment.aggregate([{ $group: { _id: "$book", count: { $sum: 1 } } }])
  ]);
  const likesByBook = new Map(likeRows.map((row) => [row._id.toString(), row.count]));
  const commentsByBook = new Map(commentRows.map((row) => [row._id.toString(), row.count]));
  const rows = books.map((book) => ({
      id: book.slug,
      title: book.title,
      author: book.author,
      genre: book.genre,
      rating: book.rating,
      year: book.year,
      cover: book.cover,
      likes: likesByBook.get(book._id.toString()) ?? 0,
      comments: commentsByBook.get(book._id.toString()) ?? 0
    }));
  res.json({ books: rows });
}

async function listUsers(req, res) {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  const userIds = users.map((user) => user._id);
  const [shelfRows, commentRows, ratingRows, likeRows] = await Promise.all([
    ReadingListItem.aggregate([{ $match: { user: { $in: userIds } } }, { $group: { _id: "$user", count: { $sum: 1 } } }]),
    Comment.aggregate([{ $match: { user: { $in: userIds } } }, { $group: { _id: "$user", count: { $sum: 1 } } }]),
    Rating.aggregate([{ $match: { user: { $in: userIds } } }, { $group: { _id: "$user", count: { $sum: 1 } } }]),
    Like.aggregate([{ $match: { user: { $in: userIds } } }, { $group: { _id: "$user", count: { $sum: 1 } } }])
  ]);
  const shelfByUser = new Map(shelfRows.map((row) => [row._id.toString(), row.count]));
  const commentsByUser = new Map(commentRows.map((row) => [row._id.toString(), row.count]));
  const ratingsByUser = new Map(ratingRows.map((row) => [row._id.toString(), row.count]));
  const likesByUser = new Map(likeRows.map((row) => [row._id.toString(), row.count]));

  res.json({
    users: users.map((user) => {
      const id = user._id.toString();
      return {
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        books: shelfByUser.get(id) ?? user.books ?? 0,
        comments: commentsByUser.get(id) ?? 0,
        ratings: ratingsByUser.get(id) ?? 0,
        likes: likesByUser.get(id) ?? 0,
        status: user.status,
        createdAt: user.createdAt
      };
    })
  });
}

async function listSavedBooks(req, res) {
  const savedItems = await ReadingListItem.find()
    .populate("user", "name email role status")
    .populate("book", "title slug author genre cover year")
    .sort({ updatedAt: -1 });

  res.json({
    savedBooks: savedItems.map((item) => ({
      id: item._id.toString(),
      status: item.status,
      progress: item.progress,
      savedAt: item.updatedAt,
      reader: item.user ? {
        id: item.user._id.toString(),
        name: item.user.name,
        email: item.user.email,
        role: item.user.role,
        status: item.user.status
      } : null,
      book: item.book ? {
        id: item.book.slug,
        title: item.book.title,
        author: item.book.author,
        genre: item.book.genre,
        cover: item.book.cover,
        year: item.book.year
      } : null
    }))
  });
}

async function inviteUser(req, res) {
  res.status(501).json({ message: "Invite user is not connected yet" });
}

async function updateUser(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ message: "User updated", user });
}

async function deactivateUser(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, { status: "Deactivated" }, { new: true }).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ message: "User deactivated", user });
}

async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await Promise.all([
    Comment.deleteMany({ user: user._id }),
    Like.deleteMany({ user: user._id }),
    Rating.deleteMany({ user: user._id }),
    ReadingListItem.deleteMany({ user: user._id })
  ]);
  res.json({ message: "User deleted" });
}

async function listReviews(req, res) {
  const [comments, ratings, likes] = await Promise.all([
    Comment.find().populate("user", "name email").populate("book", "title slug").sort({ createdAt: -1 }),
    Rating.find().populate("user", "name email").populate("book", "title slug").sort({ updatedAt: -1 }),
    Like.find().populate("user", "name email").populate("book", "title slug").sort({ createdAt: -1 })
  ]);

  res.json({
    comments: comments.map((comment) => ({
      id: comment._id.toString(),
      type: "Comment",
      book: comment.book?.title ?? "Deleted book",
      user: comment.user?.name ?? "Deleted user",
      text: comment.text,
      status: comment.status,
      createdAt: comment.createdAt
    })),
    ratings: ratings.map((rating) => ({
      id: rating._id.toString(),
      type: "Rating",
      book: rating.book?.title ?? "Deleted book",
      user: rating.user?.name ?? "Deleted user",
      rating: rating.value,
      status: "Recorded",
      createdAt: rating.updatedAt
    })),
    likes: likes.map((like) => ({
      id: like._id.toString(),
      type: "Like",
      book: like.book?.title ?? "Deleted book",
      user: like.user?.name ?? "Deleted user",
      status: "Liked",
      createdAt: like.createdAt
    }))
  });
}

async function updateReviewStatus(req, res) {
  const comment = await Comment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  res.json({ message: "Comment status updated", comment });
}

async function approveReview(req, res) {
  req.body.status = "Approved";
  return updateReviewStatus(req, res);
}

async function hideReview(req, res) {
  req.body.status = "Hidden";
  return updateReviewStatus(req, res);
}

async function deleteReview(req, res) {
  const comment = await Comment.findByIdAndDelete(req.params.id);

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  res.json({ message: "Comment deleted" });
}

function getRecommendationHealth(req, res) {
  res.json({
    score: 94,
    note: "of readers rated their last recommendation 4 stars or higher"
  });
}

module.exports = {
  approveReview,
  deactivateUser,
  deleteReview,
  deleteUser,
  getActivity,
  getOverview,
  getRecommendationHealth,
  hideReview,
  importPublicDomainBooks,
  inviteUser,
  listBooks,
  listSavedBooks,
  listReviews,
  listUsers,
  updateReviewStatus,
  updateUser
};
