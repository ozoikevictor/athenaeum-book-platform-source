const { books, readingList, users } = require("../data");

const createToken = (user) => `demo-token-${user.id}`;
const getCurrentUser = () => users[0];
const createSlug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const getBook = (id) => books.find((item) => item.id === id);
const getReadingListItem = (id) => readingList.find((item) => item.id === id || item.bookId === id);

const readingActivity = [45, 62, 38, 74, 56, 88, 68, 100].map((pages, index) => ({
  id: `week-${index + 1}`,
  label: index === 7 ? "Now" : `W${index + 1}`,
  pages
}));

const genreMix = [
  { genre: "Mystery", percent: 32 },
  { genre: "Sci-Fi", percent: 24 },
  { genre: "Literary", percent: 21 },
  { genre: "History", percent: 15 },
  { genre: "Poetry", percent: 8 }
];

const recentActivity = [
  { id: "activity-1", user: "Maya Chen", action: "saved The Cartographer's Silence", time: "4 min ago" },
  { id: "activity-2", user: "Jon Bell", action: "reviewed Orbital Gardens", time: "22 min ago" },
  { id: "activity-3", user: "Avery Stone", action: "added A Field of Small Lights", time: "1 hr ago" },
  { id: "activity-4", user: "Nora Williams", action: "updated reading preferences", time: "2 hr ago" }
];

module.exports = {
  createSlug,
  createToken,
  genreMix,
  getBook,
  getCurrentUser,
  getReadingListItem,
  readingActivity,
  recentActivity
};
