
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
const Income = require("./models/Income");
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

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

console.log("SERVER FILE STARTED");

// FILE UPLOAD DIRECTORY
const uploadDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("Only JPG, PNG, and PDF files are allowed."));
  },
});

app.use("/uploads", express.static(uploadDirectory));

// MONGODB CONNECTION
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) =>
    console.error("MongoDB connection failed:", error.message)
  );

// HEALTH CHECK
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// TEST API
app.get("/", (req, res) => {
  res.status(200).json({ message: "Expense Tracker API is running" });
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

// ==============================
// INCOME APIs
// ==============================

// GET ALL INCOME
app.get("/api/income", authenticateToken, async (req, res) => {
  try {
    const incomes = await Income.find({
      user: req.user.userId,
    }).sort({ date: -1, createdAt: -1 });

    res.json(incomes);
  } catch (error) {
    console.error("Get income error:", error.message);
    res.status(500).json({ error: "Could not load income." });
  }
});

// ADD INCOME
app.post("/api/income", authenticateToken, async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      amount === undefined ||
      amount === null ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        error: "Enter a valid income title, positive amount and category.",
      });
    }

    const income = await Income.create({
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
      date: date || new Date(),
      description:
        typeof description === "string" ? description.trim() : "",
      user: req.user.userId,
    });

    res.status(201).json(income);
  } catch (error) {
    console.error("Add income error:", error.message);
    res.status(500).json({ error: "Could not add income." });
  }
});

// UPDATE INCOME
app.put("/api/income/:id", authenticateToken, async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!income) {
      return res.status(404).json({ error: "Income entry not found." });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Invalid income title." });
      }
      income.title = title.trim();
    }

    if (amount !== undefined) {
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: "Invalid income amount." });
      }
      income.amount = Number(amount);
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({ error: "Invalid income category." });
      }
      income.category = category.trim();
    }

    if (date !== undefined) income.date = date;
    if (description !== undefined) income.description = description;

    await income.save();
    res.json(income);
  } catch (error) {
    console.error("Update income error:", error.message);
    res.status(500).json({ error: "Could not update income." });
  }
});

// DELETE INCOME
app.delete("/api/income/:id", authenticateToken, async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!income) {
      return res.status(404).json({ error: "Income entry not found." });
    }

    res.json({ message: "Income deleted successfully." });
  } catch (error) {
    console.error("Delete income error:", error.message);
    res.status(500).json({ error: "Could not delete income." });
  }
});

// ==============================
// EXPENSE APIs
// ==============================

// GET EXPENSES
app.get("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error("Get expenses error:", error.message);
    res.status(500).json({ error: "Could not load expenses." });
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

    const expense = await Expense.create({
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
      date: date || new Date(),
      description: description || "",
      user: req.user.userId,
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error("Add expense error:", error.message);
    res.status(500).json({ error: "Could not add expense." });
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

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Invalid expense title." });
      }
      expense.title = title.trim();
    }

    if (amount !== undefined) {
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: "Invalid amount." });
      }
      expense.amount = Number(amount);
    }

    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    if (description !== undefined) expense.description = description;

    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error("Update expense error:", error.message);
    res.status(500).json({ error: "Could not update expense." });
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
    console.error("Delete expense error:", error.message);
    res.status(500).json({ error: "Could not delete expense." });
  }
});

// ==============================
// FILE UPLOAD
// ==============================

app.post(
  "/api/upload",
  authenticateToken,
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: "File is too large. Maximum size is 5 MB.",
            });
          }

          return res.status(400).json({
            error: "Upload failed: " + error.message,
          });
        }

        return res.status(400).json({
          error: error.message || "File upload failed.",
        });
      }

      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "Please select a file to upload.",
      });
    }

    res.status(201).json({
      message: "File uploaded successfully.",
      file: req.file.filename,
      path: "/uploads/" + req.file.filename,
      url: `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(
        req.file.filename
      )}`,
    });
  }
);

// ==============================
// REGISTER
// ==============================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        error: "Name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    const user = await new User({
      name: name.trim(),
      email: normalizedEmail,
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
    console.error("Register error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// ==============================
// LOGIN
// ==============================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    // Compatible with the existing User model.
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
    console.error("Login error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// ==============================
// GOOGLE LOGIN
// ==============================

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

    const normalizedEmail = payload.email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = new User({
        name: payload.name || "Google User",
        email: normalizedEmail,
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

// GLOBAL ERROR HANDLER
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "An unexpected server error occurred.",
  });
});

// START SERVER
// Render requires binding to 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
