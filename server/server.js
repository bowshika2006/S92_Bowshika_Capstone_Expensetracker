require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const Expense = require("./models/Expense");
const User = require("./models/User");

const app = express();
const PORT = 5000;

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware
app.use(express.json());

console.log("SERVER FILE STARTED");

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// Test API
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Expense Tracker API is running",
  });
});

// =====================================================
// JWT AUTHENTICATION MIDDLEWARE
// =====================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Access token required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({
        error: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  });
};

// =====================================================
// GET ALL EXPENSES
// Protected using JWT
// =====================================================

app.get("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find();

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// =====================================================
// REGISTER
// =====================================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    const user = new User({
      name,
      email,
      password,
      authProvider: "local",
    });

    const savedUser = await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// =====================================================
// GOOGLE LOGIN
// =====================================================

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: "Google credential is required",
      });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    if (!email) {
      return res.status(400).json({
        error: "Google account email not found",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new Google user
      user = new User({
        name: name || "Google User",
        email,
        googleId,
        authProvider: "google",
      });

      await user.save();
    } else {
      // Link Google account with existing user
      if (!user.googleId) {
        user.googleId = googleId;
      }

      user.authProvider = "google";

      await user.save();
    }

    // Create JWT for our application
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google login error:", error.message);

    res.status(401).json({
      error: "Google authentication failed",
    });
  }
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log("Server is listening...");
});