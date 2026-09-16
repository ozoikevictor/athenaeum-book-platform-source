const { books, reviews } = require("../data");
const { getCurrentUser } = require("../utils/demoStore");

function listReviews(req, res) {
  res.json({ reviews });
}

function createReview(req, res) {
  const book = books.find((item) => item.id === req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const review = {
    id: `review-${reviews.length + 1}`,
    book: book.title,
    user: getCurrentUser().name,
    rating: Number(req.body.rating ?? 5),
    text: req.body.text ?? "",
    status: "Pending"
  };
  reviews.push(review);

  return res.status(201).json({ message: "Review created", review });
}

module.exports = {
  createReview,
  listReviews
};
