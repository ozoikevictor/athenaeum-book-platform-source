const express = require("express");
const {
  addReadingListItem,
  changePassword,
  deleteAccount,
  deleteReadingListItem,
  exportAccount,
  exportReportPdf,
  getActivity,
  getCommunityFeed,
  getDashboard,
  getGenreMix,
  getProfile,
  getReaders,
  getReadingList,
  updatePreferences,
  updateProfile,
  updateReadingListItem,
  toggleFollow
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect);

router.get("/me/profile", asyncHandler(getProfile));
router.put("/me/profile", asyncHandler(updateProfile));
router.put("/me/preferences", asyncHandler(updatePreferences));
router.post("/me/change-password", asyncHandler(changePassword));
router.get("/me/export", asyncHandler(exportAccount));
router.get("/me/report.pdf", asyncHandler(exportReportPdf));
router.delete("/me", asyncHandler(deleteAccount));
router.get("/me/dashboard", asyncHandler(getDashboard));
router.get("/me/activity", asyncHandler(getActivity));
router.get("/me/community-feed", asyncHandler(getCommunityFeed));
router.get("/readers", asyncHandler(getReaders));
router.post("/readers/:id/follow", asyncHandler(toggleFollow));
router.get("/me/genre-mix", asyncHandler(getGenreMix));
router.get("/me/reading-list", asyncHandler(getReadingList));
router.post("/me/reading-list", asyncHandler(addReadingListItem));
router.patch("/me/reading-list/:id", asyncHandler(updateReadingListItem));
router.delete("/me/reading-list/:id", asyncHandler(deleteReadingListItem));

module.exports = router;
