const express = require("express");
const {
  createBook,
  deleteBook,
  getBookById,
  listBooks,
  listFeaturedBooks,
  listGenres,
  listBookComments,
  rateBook,
  saveBook,
  toggleLike,
  createComment,
  updateBook
} = require("../controllers/bookController");
const { createReview } = require("../controllers/reviewController");
const { adminOnly, optionalProtect, protect } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", optionalProtect, asyncHandler(listBooks));
router.get("/genres", asyncHandler(listGenres));
router.get("/featured", asyncHandler(listFeaturedBooks));
router.get("/:id", optionalProtect, asyncHandler(getBookById));
router.post("/", protect, adminOnly, asyncHandler(createBook));
router.put("/:id", protect, adminOnly, asyncHandler(updateBook));
router.delete("/:id", protect, adminOnly, asyncHandler(deleteBook));
router.post("/:id/rate", protect, asyncHandler(rateBook));
router.post("/:id/save", protect, asyncHandler(saveBook));
router.post("/:id/like", protect, asyncHandler(toggleLike));
router.get("/:id/comments", optionalProtect, asyncHandler(listBookComments));
router.post("/:id/comments", protect, asyncHandler(createComment));
router.post("/:id/reviews", protect, asyncHandler(createReview));

module.exports = router;
