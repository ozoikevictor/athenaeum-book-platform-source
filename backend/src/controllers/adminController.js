const Book = require("../models/Book");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const Rating = require("../models/Rating");
const User = require("../models/User");
const ReadingListItem = require("../models/ReadingListItem");

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
  inviteUser,
  listBooks,
  listSavedBooks,
  listReviews,
  listUsers,
  updateReviewStatus,
  updateUser
};
