function ExpenseForm() {
  return (
    <form>
      <h2>Add Expense</h2>

      <input
        type="text"
        placeholder="Expense name"
      />

      <input
        type="number"
        placeholder="Amount"
      />

      <button type="submit">Add Expense</button>
    </form>
  );
}

export default ExpenseForm;