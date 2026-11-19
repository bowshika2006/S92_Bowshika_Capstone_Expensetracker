const categoryStyles = {
  Food: ["food", "✦"],
  Transport: ["transport", "↗"],
  Shopping: ["shopping", "◇"],
  Bills: ["bills", "⌁"],
  Entertainment: ["entertainment", "♫"],
  Health: ["health", "♡"],
  Education: ["education", "▤"],
  Other: ["other", "•"],
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function ExpenseList({ expenses, onEdit, onDelete }) {
  return (
    <section className="panel expense-list-panel">
      <div className="panel-heading list-heading">
        <div>
          <span className="section-kicker">YOUR RECENT ACTIVITY</span>
          <h2>Expenses <span className="count-badge">{expenses.length}</span></h2>
        </div>
        <span className="list-heading-note">Newest first</span>
      </div>

      {expenses.length === 0 ? (
        <div className="list-empty">
          <span className="empty-illustration" aria-hidden="true">✦</span>
          <h3>Your list is ready for a first</h3>
          <p>Add an expense above and it will show up here.</p>
        </div>
      ) : (
        <div className="expense-rows">
          {expenses.map((expense) => {
            const [styleName, icon] = categoryStyles[expense.category] || categoryStyles.Other;
            const formattedDate = expense.date
              ? new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(`${expense.date}T00:00:00`))
              : "Date not set";

            return (
              <article className="expense-row" key={expense.id}>
                <span className={`category-icon category-${styleName}`} aria-hidden="true">{icon}</span>
                <div className="expense-details">
                  <h3>{expense.title}</h3>
                  <p>{expense.category} <span aria-hidden="true">·</span> {formattedDate}</p>
                  {expense.description && <p className="expense-description">{expense.description}</p>}
                </div>
                <strong className="expense-amount">−{currency.format(Number(expense.amount) || 0)}</strong>
                <div className="row-actions">
                  <button type="button" aria-label={`Edit ${expense.title}`} onClick={() => onEdit(expense)}>
                    Edit
                  </button>
                  <button
                    className="delete-action"
                    type="button"
                    aria-label={`Delete ${expense.title}`}
                    onClick={() => {
                      if (window.confirm(`Delete "${expense.title}"?`)) onDelete(expense.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ExpenseList;
