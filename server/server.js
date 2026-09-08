require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Expense = require("./models/Expense");

const app = express();
const PORT = 5000;

console.log("SERVER FILE STARTED");

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// Test API
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Expense Tracker API is running"
  });
});

// GET API - Get all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find();

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch expenses"
    });
  }
});

// GET API - Get expense by ID
app.get("/api/expenses/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        error: "Expense not found"
      });
    }

    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch expense"
    });
  }
});

// GET API - Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Expense.distinct("category");

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch categories"
    });
  }
});

// POST API - Add a new expense
app.post("/api/expenses", async (req, res) => {
  try {
    const expense = new Expense(req.body);
    const savedExpense = await expense.save();

    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});