const Book = require("../models/Book");
const bcrypt = require("bcryptjs");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const PDFDocument = require("pdfkit");
const Rating = require("../models/Rating");
const ReadingListItem = require("../models/ReadingListItem");

function formatBook(book, item) {
  return {
    id: book.slug,
    mongoId: book._id.toString(),
    title: book.title,
    author: book.author,
    genre: book.genre,
    rating: book.rating ?? 0,
    year: book.year,
    pages: book.pages,
    description: book.description ?? "",
    reason: book.reason ?? "Recommended for your shelf",
    tags: book.tags ?? [],
    cover: book.cover ?? "",
    status: item.status,
    progress: item.progress,
    userRating: item.userRating
  };
}

function formatCatalogBook(book, reason) {
  return {
    id: book.slug,
    mongoId: book._id.toString(),
    title: book.title,
    author: book.author,
    genre: book.genre,
    rating: book.rating,
    year: book.year,
    pages: book.pages,
    description: book.description,
    reason,
    tags: book.tags,
    cover: book.cover
  };
}

function formatReadingItem(item, rating) {
  const book = formatBook(item.book, item);

  return {
    id: item._id.toString(),
    bookId: item.book.slug,
    status: item.status,
    progress: item.progress,
    book: { ...book, userRating: rating?.value }
  };
}

function buildGenreMix(items) {
  const totals = new Map();

  items.forEach((item) => {
    const genre = item.book.genre || "Other";
    totals.set(genre, (totals.get(genre) || 0) + 1);
  });

  if (!items.length) return [];

  return [...totals.entries()]
    .map(([genre, count]) => ({ genre, percent: Math.round((count / items.length) * 100) }))
    .sort((a, b) => b.percent - a.percent);
}

async function getProfile(req, res) {
  res.json({
    user: {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      books: req.user.books,
      status: req.user.status,
      favoriteGenres: req.user.favoriteGenres,
      readingPreferences: req.user.readingPreferences ?? {
        weeklyRecommendations: true,
        newReleaseAlerts: true,
        communityActivity: false
      }
    }
  });
}

async function updateProfile(req, res) {
  const allowed = ["name", "favoriteGenres"];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  });
  await req.user.save();
  res.json({ message: "Profile updated", user: req.user });
}

function updatePreferences(req, res) {
  res.json({ message: "Preferences updated", preferences: req.body });
}

function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required" });
  }

  return bcrypt.compare(currentPassword, req.user.password).then(async (matches) => {
    const legacyMatches = req.user.password === currentPassword;

    if (!matches && !legacyMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    req.user.password = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    return res.json({ message: "Password changed" });
  });
}

async function exportAccount(req, res) {
  const readingList = await ReadingListItem.find({ user: req.user._id }).populate("book");
  res.json({
    user: {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      favoriteGenres: req.user.favoriteGenres
    },
    readingList: readingList.map(formatReadingItem)
  });
}

async function exportReportPdf(req, res) {
  const dashboard = await new Promise((resolve, reject) => {
    const mockRes = { json: resolve };
    Promise.resolve(getDashboard(req, mockRes)).catch(reject);
  });
  const doc = new PDFDocument({ margin: 48 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=athenaeum-reading-report.pdf");
  doc.pipe(res);

  doc.fontSize(22).text("Athenaeum Reading Report", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#666").text(`Reader: ${req.user.name}`);
  doc.text(`Email: ${req.user.email}`);
  doc.text(`Exported: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.fillColor("#000").fontSize(16).text("Dashboard Summary");
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Books read: ${dashboard.stats.booksRead}`);
  doc.text(`Average rating: ${dashboard.stats.averageRating}`);
  doc.text(`Currently reading: ${dashboard.stats.currentlyReading}`);
  doc.text(`Recommendation matches: ${dashboard.recommendations.length}`);
  doc.moveDown();

  doc.fontSize(16).text("Genre Mix");
  doc.moveDown(0.5);
  if (dashboard.genreMix.length) {
    dashboard.genreMix.forEach((item) => doc.fontSize(12).text(`${item.genre}: ${item.percent}%`));
  } else {
    doc.fontSize(12).text("No genre data yet.");
  }
  doc.moveDown();

  doc.fontSize(16).text("Recently Added To Shelf");
  doc.moveDown(0.5);
  if (dashboard.readingList.length) {
    dashboard.readingList.forEach((item) => {
      doc.fontSize(12).text(`${item.book.title} by ${item.book.author} - ${item.status} (${item.progress}%)`);
    });
  } else {
    doc.fontSize(12).text("No saved books yet.");
  }
  doc.moveDown();

  doc.fontSize(16).text("Recommendations");
  doc.moveDown(0.5);
  if (dashboard.recommendations.length) {
    dashboard.recommendations.forEach((book) => {
      doc.fontSize(12).text(`${book.title} by ${book.author}`);
      doc.fontSize(10).fillColor("#666").text(book.reason);
      doc.fillColor("#000").moveDown(0.25);
    });
  } else {
    doc.fontSize(12).text("No recommendations yet.");
  }

  doc.end();
}

async function deleteAccount(req, res) {
  await Promise.all([
    ReadingListItem.deleteMany({ user: req.user._id }),
    Rating.deleteMany({ user: req.user._id }),
    Like.deleteMany({ user: req.user._id }),
    Comment.deleteMany({ user: req.user._id })
  ]);
  await req.user.deleteOne();
  res.json({ message: "Account deleted" });
}

async function getDashboard(req, res) {
  const readingItems = await ReadingListItem.find({ user: req.user._id }).populate("book").sort({ updatedAt: -1 });
  const userRatings = await Rating.find({ user: req.user._id }).populate("book");
  const completed = readingItems.filter((item) => item.status === "Finished");
  const currentlyReading = readingItems.filter((item) => item.status === "Currently Reading");
  const rated = userRatings.filter((item) => item.value > 0);
  const averageRating = rated.length
    ? Number((rated.reduce((total, item) => total + item.value, 0) / rated.length).toFixed(1))
    : 0;
  const pagesThisWeek = currentlyReading.reduce((total, item) => total + Math.round((item.book.pages || 0) * ((item.progress || 0) / 100)), 0);
  const preferredGenres = [
    ...new Set([
      ...req.user.favoriteGenres,
      ...completed.map((item) => item.book.genre),
      ...userRatings.filter((item) => item.value >= 4).map((item) => item.book.genre)
    ].filter(Boolean))
  ];
  const recommendationFilter = {
    _id: { $nin: readingItems.map((item) => item.book._id) }
  };

  if (preferredGenres.length) {
    recommendationFilter.genre = { $in: preferredGenres };
  }

  let recommendations = await Book.find(recommendationFilter).sort({ rating: -1, createdAt: -1 }).limit(4);

  if (recommendations.length < 4) {
    const fallback = await Book.find({
      _id: { $nin: [...readingItems.map((item) => item.book._id), ...recommendations.map((book) => book._id)] }
    }).sort({ rating: -1, createdAt: -1 }).limit(4 - recommendations.length);
    recommendations = recommendations.concat(fallback);
  }

  res.json({
    stats: {
      booksRead: completed.length,
      averageRating,
      currentlyReading: currentlyReading.length,
      pagesThisWeek
    },
    activity: [20, 35, 45, 25, 55, 40, 70, Math.max(10, Math.min(100, pagesThisWeek || 10))].map((pages, index) => ({
      id: `week-${index + 1}`,
      label: index === 7 ? "Now" : `W${index + 1}`,
      pages
    })),
    genreMix: buildGenreMix(readingItems),
    readingList: readingItems.slice(0, 4).map((item) => formatReadingItem(item, userRatings.find((rating) => rating.book._id.equals(item.book._id)))),
    recommendations: recommendations.map((book) => {
      const reason = preferredGenres.includes(book.genre)
        ? `Recommended because you like ${book.genre}`
        : "Popular with readers in the catalog";
      return formatCatalogBook(book, reason);
    })
  });
}

async function getActivity(req, res) {
  const dashboard = await new Promise((resolve) => {
    const mockRes = { json: resolve };
    getDashboard(req, mockRes);
  });
  res.json({ activity: dashboard.activity });
}

async function getGenreMix(req, res) {
  const items = await ReadingListItem.find({ user: req.user._id }).populate("book");
  res.json({ genreMix: buildGenreMix(items) });
}

async function getReadingList(req, res) {
  const { status = "All" } = req.query;
  const filter = { user: req.user._id };

  if (status !== "All") {
    filter.status = status;
  }

  const readingList = await ReadingListItem.find(filter).populate("book").sort({ updatedAt: -1 });
  const ratings = await Rating.find({ user: req.user._id, book: { $in: readingList.map((item) => item.book._id) } });
  res.json({
    readingList: readingList.map((item) => formatReadingItem(item, ratings.find((rating) => rating.book.equals(item.book._id))))
  });
}

async function addReadingListItem(req, res) {
  const book = await Book.findOne({
    $or: [{ slug: req.body.bookId }, { _id: /^[a-f\d]{24}$/i.test(req.body.bookId) ? req.body.bookId : undefined }].filter((item) => Object.values(item)[0])
  });

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

  return res.status(201).json({ message: "Book saved", readingListItem: formatReadingItem(item) });
}

async function updateReadingListItem(req, res) {
  const item = await ReadingListItem.findOne({ _id: req.params.id, user: req.user._id }).populate("book");

  if (!item) {
    return res.status(404).json({ message: "Reading list item not found" });
  }

  if (req.body.status) item.status = req.body.status;
  if (req.body.progress !== undefined) item.progress = req.body.progress;
  await item.save();
  await item.populate("book");

  return res.json({ message: "Reading list updated", readingListItem: formatReadingItem(item) });
}

async function deleteReadingListItem(req, res) {
  const item = await ReadingListItem.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!item) {
    return res.status(404).json({ message: "Reading list item not found" });
  }

  res.json({ message: "Book removed from reading list" });
}

module.exports = {
  addReadingListItem,
  changePassword,
  deleteAccount,
  deleteReadingListItem,
  exportAccount,
  exportReportPdf,
  getActivity,
  getDashboard,
  getGenreMix,
  getProfile,
  getReadingList,
  updatePreferences,
  updateProfile,
  updateReadingListItem
};
