import { useState } from "react";

function ExpenseList() {
  const [expenses, setExpenses] = useState([
    { id: 1, name: "Food", amount: 250 },
    { id: 2, name: "Travel", amount: 100 },
    { id: 3, name: "Shopping", amount: 500 },
  ]);

  // Update expense
  const handleUpdate = (id) => {
    const newName = prompt("Enter new expense name:");
    const newAmount = prompt("Enter new amount:");

    if (!newName || !newAmount) {
      return;
    }

    setExpenses(
      expenses.map((expense) =>
        expense.id === id
          ? {
              ...expense,
              name: newName,
              amount: Number(newAmount),
            }
          : expense
      )
    );
  };

  // Delete expense
  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (confirmDelete) {
      setExpenses(
        expenses.filter((expense) => expense.id !== id)
      );
    }
  };

  return (
    <section>
      <h2>Expense List</h2>

      {expenses.map((expense) => (
        <div key={expense.id}>
          <span>{expense.name}</span>
          <span> ₹{expense.amount}</span>

          <button onClick={() => handleUpdate(expense.id)}>
            Edit
          </button>

          <button onClick={() => handleDelete(expense.id)}>
            Delete
          </button>
        </div>
      ))}
    </section>
  );
}

export default ExpenseList;