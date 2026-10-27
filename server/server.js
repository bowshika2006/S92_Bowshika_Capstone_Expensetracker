
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Expense = require("./models/Expense");
const User = require("./models/User");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// MIDDLEWARE
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

console.log("SERVER FILE STARTED");

// FILE UPLOAD SETUP
const uploadDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static(uploadDirectory));

// MONGODB CONNECTION
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) =>
    console.error("MongoDB connection failed:", error.message)
  );

// TEST API
app.get("/", (req, res) => {
  res.json({ message: "Expense Tracker API is running" });
});

// JWT AUTHENTICATION
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please login first." });
  }

  jwt.verify(
    authHeader.split(" ")[1],
    process.env.JWT_SECRET,
    (error, decodedUser) => {
      if (error) {
        return res.status(403).json({
          error: "Invalid or expired token. Please login again.",
        });
      }

      req.user = decodedUser;
      next();
    }
  );
};

// GET EXPENSES
app.get("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD EXPENSE
app.post("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      amount === undefined ||
      amount === null ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        error: "Enter a valid expense name and positive amount.",
      });
    }

    if (typeof category !== "string" || !category.trim()) {
      return res.status(400).json({
        error: "Please select an expense category.",
      });
    }

    const expense = new Expense({
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
      date: date || Date.now(),
      description: description || "",
      user: req.user.userId,
    });

    const savedExpense = await expense.save();

    res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Add expense error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE EXPENSE
app.put("/api/expenses/:id", authenticateToken, async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found." });
    }

    if (title !== undefined) expense.title = title;
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    if (description !== undefined) expense.description = description;

    await expense.save();

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE EXPENSE
app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found." });
    }

    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FILE UPLOAD
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  res.json({
    message: "File uploaded successfully",
    file: req.file.filename,
    path: "/uploads/" + req.file.filename,
  });
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    const user = await new User({
      name,
      email,
      password,
      authProvider: "local",
    }).save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GOOGLE LOGIN
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: "Google credential is required.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({
        error: "Google account email not found.",
      });
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = new User({
        name: payload.name || "Google User",
        email: payload.email,
        googleId: payload.sub,
        authProvider: "google",
      });
    } else {
      if (!user.googleId) user.googleId = payload.sub;
      user.authProvider = "google";
    }

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
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
      error: "Google authentication failed.",
    });
  }
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
  console.log("Server is listening...");
});
