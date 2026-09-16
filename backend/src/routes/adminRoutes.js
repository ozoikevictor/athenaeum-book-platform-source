const express = require("express");
const {
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
} = require("../controllers/adminController");
const { adminOnly, protect } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/overview", asyncHandler(getOverview));
router.get("/activity", asyncHandler(getActivity));
router.get("/books", asyncHandler(listBooks));
router.get("/saved-books", asyncHandler(listSavedBooks));
router.get("/users", asyncHandler(listUsers));
router.post("/users", asyncHandler(inviteUser));
router.put("/users/:id", asyncHandler(updateUser));
router.patch("/users/:id/deactivate", asyncHandler(deactivateUser));
router.delete("/users/:id", asyncHandler(deleteUser));
router.get("/reviews", asyncHandler(listReviews));
router.patch("/reviews/:id/status", asyncHandler(updateReviewStatus));
router.patch("/reviews/:id/approve", asyncHandler(approveReview));
router.patch("/reviews/:id/hide", asyncHandler(hideReview));
router.delete("/reviews/:id", asyncHandler(deleteReview));
router.get("/recommendations/health", asyncHandler(getRecommendationHealth));

module.exports = router;
