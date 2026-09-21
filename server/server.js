require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Expense = require("./models/Expense");
const User = require("./models/User");

const app = express();
const PORT = 5000;

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

// JWT Authentication Middleware
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

// GET API - Get all expenses
// Protected using JWT
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

// REGISTER
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

// LOGIN
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

// START SERVER
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log("Server is listening...");
});