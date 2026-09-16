const express = require("express");
const { listReviews } = require("../controllers/reviewController");

const router = express.Router();

router.get("/", listReviews);

module.exports = router;
