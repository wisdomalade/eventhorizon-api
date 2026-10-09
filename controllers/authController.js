const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const {
  registerSchema,
  loginSchema,
} = require("../validators/authValidator");

const { sendVerificationEmail } = require("../utils/sendEmail");

// REGISTER
const register = async (req, res, next) => {
  try {
    // 1. Validate registration data
    const { error } = registerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // 2. Get validated data
    const { name, email, password } = req.body;

    // 3. Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 6. Hash verification token before storing it
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // 7. Token expires after 1 hour
    const verificationTokenExpires = new Date(
      Date.now() + 60 * 60 * 1000
    );

    // 8. Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationTokenHash,
      verificationTokenExpires,
    });

    // 9. Create verification URL
    const verificationUrl =
      `http://localhost:${process.env.PORT || 5000}` +
      `/api/auth/verify-email?token=${verificationToken}`;

    // 10. Send verification email
    try {
      await sendVerificationEmail(email, verificationUrl);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      await User.findByIdAndDelete(user._id);

      return res.status(500).json({
        success: false,
        message:
          "Registration failed because the verification email could not be sent",
      });
    }

    // 11. Registration response
    return res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// VERIFY EMAIL
const verifyEmail = async (req, res, next) => {
  try {
    // 1. Get token from URL
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // 2. Hash the received token
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 3. Find user using the hashed token
    const user = await User.findOne({
      verificationTokenHash,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or already used verification token",
      });
    }

    // 4. Check token expiry
    if (
      !user.verificationTokenExpires ||
      user.verificationTokenExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification token has expired",
      });
    }

    // 5. Mark email as verified
    user.isVerified = true;

    // 6. Remove verification token
    user.verificationTokenHash = null;
    user.verificationTokenExpires = null;

    await user.save();

    // 7. Send response
    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// LOGIN
const login = async (req, res, next) => {
  try {
    // 1. Validate login data
    const { error } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // 2. Get email and password
    const { email, password } = req.body;

    // 3. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Check email verification
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // 5. Compare password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 6. Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    // 7. Send login response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
};