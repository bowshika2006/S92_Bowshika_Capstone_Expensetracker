require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Expense = require("./models/Expense");

const app = express();
const PORT = 5000;

// Middleware
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
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        error: "Expense not found"
      });
    }

    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});