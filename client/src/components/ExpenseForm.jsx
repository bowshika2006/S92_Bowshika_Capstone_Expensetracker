import { useState } from "react";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

function todayAsInputValue() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function ExpenseForm({ initialValue, onAddExpense, onCancel, saving }) {
  const [title, setTitle] = useState(initialValue?.title || "");
  const [amount, setAmount] = useState(initialValue?.amount ?? "");
  const [category, setCategory] = useState(initialValue?.category || "");
  const [date, setDate] = useState(
    initialValue?.date ? new Date(initialValue.date).toISOString().slice(0, 10) : todayAsInputValue()
  );
  const [description, setDescription] = useState(initialValue?.description || "");
  const isEditing = Boolean(initialValue);

  async function handleSubmit(event) {
    event.preventDefault();
    const saved = await onAddExpense({
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      description: description.trim(),
    });

    if (saved && !isEditing) {
      setTitle("");
      setAmount("");
      setCategory("");
      setDate(todayAsInputValue());
      setDescription("");
    }
  }

  return (
    <section className="panel expense-form-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">{isEditing ? "MAKE A CHANGE" : "KEEP IT UP TO DATE"}</span>
          <h2>{isEditing ? "Edit expense" : "Add an expense"}</h2>
        </div>
        <span className="heading-icon form-icon" aria-hidden="true">{isEditing ? "✎" : "＋"}</span>
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label className="field field-wide">
          <span>What did you spend on?</span>
          <input
            type="text"
            placeholder="e.g. Coffee with friends"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />
        </label>

        <label className="field">
          <span>Amount</span>
          <div className="amount-input">
            <span aria-hidden="true">₹</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </div>
        </label>

        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} required>
            <option value="" disabled>Choose one</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>

        <label className="field field-wide">
          <span>Note <span className="optional-label">· optional</span></span>
          <input
            type="text"
            placeholder="Add a little detail"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={250}
          />
        </label>

        <div className="form-actions field-wide">
          {isEditing && (
            <button className="button button-quiet" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
          )}
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add expense"}
            <span aria-hidden="true">{isEditing ? "✓" : "↗"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}

export default ExpenseForm;
