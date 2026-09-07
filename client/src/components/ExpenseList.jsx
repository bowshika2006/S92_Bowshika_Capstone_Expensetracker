function ExpenseList() {
  const expenses = [
    { id: 1, name: "Food", amount: 250 },
    { id: 2, name: "Travel", amount: 100 },
    { id: 3, name: "Shopping", amount: 500 },
  ];

  return (
    <section>
      <h2>Expense List</h2>

      {expenses.map((expense) => (
        <div key={expense.id}>
          <span>{expense.name}</span>
          <span> ₹{expense.amount}</span>
        </div>
      ))}
    </section>
  );
}

export default ExpenseList;