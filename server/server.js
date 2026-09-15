// PUT API - Update an existing expense
app.put("/api/expenses/:id", async (req, res) => {
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