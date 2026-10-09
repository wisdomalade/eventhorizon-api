const express = require("express");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Profile accessed successfully",
    user: {
      userId: req.user.userId,
      email: req.user.email,
    },
  });
});

module.exports = router;