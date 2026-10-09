const express = require("express");

const {
  register,
  verifyEmail,
  login,
} = require("../controllers/authController");

const router = express.Router();

// Register
router.post("/register", register);





// Verify email
router.get("/verify-email", verifyEmail);

// Login
router.post("/login", login);

module.exports = router;