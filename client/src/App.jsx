import { useEffect, useMemo, useState } from "react";
import moneyIllustration from "./assets/money-illustration.svg";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") || "";
const AUTH_KEY = "pennywise-auth";
const APPEARANCE_KEY = "pennywise-appearance-v2";
const isAuthError = (error) => error.status === 401 || error.status === 403;

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment",
  "Health", "Education", "Salary", "Freelance", "Investment", "Other",
];
const CATEGORY_ICONS = {
  Food: "♨",
  Transport: "↗",
  Shopping: "▣",
  Bills: "▤",
  Entertainment: "◉",
  Health: "♡",
  Education: "⌂",
  Salary: "↥",
  Freelance: "✦",
  Investment: "◇",
  Other: "＋",
};

const money = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateText = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

async function api(path, token, options = {}) {
  if (!import.meta.env.DEV && !API_URL) {
    throw new Error(
      "The API server is not configured. Set VITE_API_URL to your deployed API URL and redeploy the website."
    );
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the API server. Check that the API is running, VITE_API_URL is correct, and the API allows this website's origin.",
        { cause: error }
      );
    }
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiError = new Error(
      data.message || data.error || "Something went wrong."
    );
    apiError.status = response.status;
    throw apiError;
  }

  return data;
}

function readAuth() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_KEY));
    return saved?.token && saved?.user ? saved : null;
  } catch {
    return null;
  }
}

function AuthPage({ onLogin, notice, darkMode }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "register") {
        await api("/api/auth/register", null, {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        });
      }

      const result = await api("/api/auth/login", null, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const token = result.token || result.accessToken;
      const user = result.user || result.data?.user;

      if (!token || !user) {
        throw new Error("Login response is missing user or token.");
      }

      onLogin({ token, user });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`auth-screen ${darkMode ? "theme-dark" : ""}`}>
      <div className="auth-visual" aria-hidden="true">
        <img src={moneyIllustration} alt="" />
      </div>

      <section className="auth-card">
        <a className="brand auth-brand" href="/">
          <span className="brand-mark">p</span>
          <span>
            Pennywise<span className="brand-period">.</span>
          </span>
        </a>

        <span className="eyebrow">YOUR MONEY, MADE CLEAR</span>

        <h1>
          {mode === "login"
            ? "Welcome back."
            : "Start your money journey."}
        </h1>

        <p className="muted">
          Track spending, plan budgets, and build better money habits.
        </p>

        {notice && <p className="notice" role="status">{notice}</p>}

        <form className="stack-form" onSubmit={submit}>
          {mode === "register" && (
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button
            className="primary-button full-button"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "New to Pennywise?"
            : "Already have an account?"}{" "}

          <button
            type="button"
            className="text-button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}

function StatCard({ label, value, note, icon, kind = "" }) {
  return (
    <article className={`stat-card ${kind}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function EntryForm({ type, onSave, busy, showCategoryGrid = false }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(
    type === "income" ? "Salary" : "Food"
  );
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState("");

  async function submit(event) {
    event.preventDefault();

    const saved = await onSave({
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      description: description.trim(),
    });

    if (saved) {
      setTitle("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <label>
        Description
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === "income"
              ? "e.g. Monthly salary"
              : "e.g. Lunch"
          }
          required
          maxLength={100}
        />
      </label>

      <div className="form-row">
        <label>
          Amount (₹)
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />
        </label>

        {showCategoryGrid ? (
          <fieldset className="category-picker">
            <legend>Category</legend>
            <div className="category-grid">
              {CATEGORIES.filter((item) =>
                type === "income"
                  ? ["Salary", "Freelance", "Investment", "Other"].includes(item)
                  : !["Salary", "Freelance", "Investment"].includes(item)
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={category === item ? "category-option selected" : "category-option"}
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                >
                  <span aria-hidden="true">{CATEGORY_ICONS[item]}</span>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.filter((item) =>
                type === "income"
                  ? ["Salary", "Freelance", "Investment", "Other"].includes(item)
                  : !["Salary", "Freelance", "Investment"].includes(item)
              ).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="form-row">
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label>
          Note (optional)
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note"
            maxLength={250}
          />
        </label>
      </div>

      <button className="primary-button" disabled={busy}>
        {busy ? "Saving..." : `＋ Add ${type}`}
      </button>
    </form>
  );
}

function TransactionTable({ entries, currency, onDelete }) {
  if (!entries.length) {
    return (
      <div className="empty-state">
        No transactions found. Add income or an expense to get started.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Category</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {entries.map((item) => (
            <tr key={`${item.entryType}-${item._id || item.id}`}>
              <td>
                <div className="transaction-title">
                  <span
                    className={
                      item.entryType === "Income"
                        ? "transaction-symbol income-symbol"
                        : "transaction-symbol expense-symbol"
                    }
                  >
                    {item.entryType === "Income" ? "↗" : "↘"}
                  </span>

                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.description || item.entryType}</small>
                  </div>
                </div>
              </td>

              <td>
                <span className="category-chip">{item.category}</span>
              </td>

              <td>{dateText(item.date)}</td>

              <td
                className={
                  item.entryType === "Income"
                    ? "positive amount-cell"
                    : "negative amount-cell"
                }
              >
                {item.entryType === "Income" ? "+" : "−"}
                {money(item.amount, currency)}
              </td>

              <td>
                <button
                  className="delete-button"
                  onClick={() => onDelete(item)}
                  aria-label={`Delete ${item.title}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [auth, setAuth] = useState(readAuth);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [chartType, setChartType] = useState("Expense");
  const [chartPeriod, setChartPeriod] = useState("Month");
  const [addType, setAddType] = useState("expense");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("all");

  const [budget, setBudget] = useState(
    () => Number(localStorage.getItem("pennywise-budget")) || 15000
  );

  const [goal, setGoal] = useState(
    () => Number(localStorage.getItem("pennywise-goal")) || 5000
  );

  const [currency, setCurrency] = useState(
    () => localStorage.getItem("pennywise-currency") || "INR"
  );

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(APPEARANCE_KEY) !== "light"
  );

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = auth?.token;

  useEffect(() => {
    if (auth) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [auth]);

  useEffect(() => {
    localStorage.setItem("pennywise-budget", String(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem("pennywise-goal", String(goal));
  }, [goal]);

  useEffect(() => {
    localStorage.setItem("pennywise-currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(APPEARANCE_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);

    return () => document.body.classList.remove("dark-mode");
  }, [darkMode]);

  // Fetch income and expenses when the user logs in.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (cancelled) return null;

        setLoading(true);
        setError("");

        return Promise.all([
          api("/api/expenses", token),
          api("/api/income", token),
        ]);
      })
      .then((data) => {
        if (cancelled || !data) return;

        const [expenseData, incomeData] = data;

        setExpenses(
          Array.isArray(expenseData)
            ? expenseData
            : expenseData.expenses || []
        );

        setIncomes(
          Array.isArray(incomeData)
            ? incomeData
            : incomeData.incomes || []
        );
      })
      .catch((err) => {
        if (!cancelled) {
          if (isAuthError(err)) {
            setAuth(null);
            setExpenses([]);
            setIncomes([]);
            setError("Your session expired. Please sign in again.");
          } else {
            setError(`${err.message} Check that the backend is running.`);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const allEntries = useMemo(
    () =>
      [
        ...expenses.map((item) => ({
          ...item,
          entryType: "Expense",
        })),
        ...incomes.map((item) => ({
          ...item,
          entryType: "Income",
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [expenses, incomes]
  );

  const currentMonth = new Date().toISOString().slice(0, 7);

  const thisMonthExpenses = expenses.filter(
    (item) => String(item.date).slice(0, 7) === currentMonth
  );

  const thisMonthIncome = incomes.filter(
    (item) => String(item.date).slice(0, 7) === currentMonth
  );

  const totalIncome = incomes.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const monthlyIncome = thisMonthIncome.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const monthlyExpenses = thisMonthExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const balance = totalIncome - totalExpenses;
  const savings = monthlyIncome - monthlyExpenses;

  const budgetPercent =
    budget > 0 ? Math.min(100, (monthlyExpenses / budget) * 100) : 0;

  const goalPercent =
    goal > 0
      ? Math.max(
          0,
          Math.min(100, (Math.max(0, savings) / goal) * 100)
        )
      : 0;

  // Lint fix: calculate directly from expenses and currentMonth.
  const categoryTotals = useMemo(() => {
    const totals = {};

    expenses
      .filter((item) => String(item.date).slice(0, 7) === currentMonth)
      .forEach((item) => {
        totals[item.category] =
          (totals[item.category] || 0) + Number(item.amount || 0);
      });

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [expenses, currentMonth]);

  const filteredEntries = allEntries.filter((item) => {
    const matchesSearch =
      `${item.title || ""} ${item.category || ""} ${item.description || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesType =
      typeFilter === "All" || item.entryType === typeFilter;

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    const matchesMonth =
      monthFilter === "all" ||
      String(item.date).slice(0, 7) === monthFilter;

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesMonth
    );
  });

  const chartEntries = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const todayText = today.toISOString().slice(0, 10);
    const weekStartText = weekStart.toISOString().slice(0, 10);
    const year = String(today.getFullYear());

    return allEntries.filter((item) => {
      if (item.entryType !== chartType) return false;

      const itemDate = String(item.date || "").slice(0, 10);
      if (chartPeriod === "Week") {
        return itemDate >= weekStartText && itemDate <= todayText;
      }
      if (chartPeriod === "Year") {
        return itemDate.slice(0, 4) === year;
      }
      return itemDate.slice(0, 7) === currentMonth;
    });
  }, [allEntries, chartType, chartPeriod, currentMonth]);

  const chartCategoryTotals = useMemo(() => {
    const totals = {};

    chartEntries.forEach((item) => {
      totals[item.category] =
        (totals[item.category] || 0) + Number(item.amount || 0);
    });

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [chartEntries]);

  const chartTotal = chartEntries.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const maxChartAmount = Math.max(0, ...chartCategoryTotals.map(([, amount]) => amount));

  async function saveEntry(type, formData) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await api(
        `/api/${type === "income" ? "income" : "expenses"}`,
        token,
        {
          method: "POST",
          body: JSON.stringify(formData),
        }
      );

      const item = result.income || result.expense || result;

      if (type === "income") {
        setIncomes((prev) => [item, ...prev]);
      } else {
        setExpenses((prev) => [item, ...prev]);
      }

      setMessage(
        `${type === "income" ? "Income" : "Expense"} added successfully.`
      );

      return true;
    } catch (err) {
      if (isAuthError(err)) {
        logout();
      } else {
        setError(err.message);
      }
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(item) {
    if (
      !window.confirm(
        `Delete this ${item.entryType.toLowerCase()} record?`
      )
    ) {
      return;
    }

    try {
      await api(
        `/api/${
          item.entryType === "Income" ? "income" : "expenses"
        }/${item._id || item.id}`,
        token,
        { method: "DELETE" }
      );

      if (item.entryType === "Income") {
        setIncomes((prev) =>
          prev.filter(
            (x) => (x._id || x.id) !== (item._id || item.id)
          )
        );
      } else {
        setExpenses((prev) =>
          prev.filter(
            (x) => (x._id || x.id) !== (item._id || item.id)
          )
        );
      }

      setMessage("Transaction deleted.");
    } catch (err) {
      if (isAuthError(err)) {
        logout();
      } else {
        setError(err.message);
      }
    }
  }

  function exportCSV() {
    const rows = [
      ["Type", "Title", "Category", "Amount", "Date", "Description"],
      ...filteredEntries.map((item) => [
        item.entryType,
        item.title,
        item.category,
        item.amount,
        String(item.date || "").slice(0, 10),
        item.description || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "pennywise-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function login(nextAuth) {
    setAuth(nextAuth);
    setExpenses([]);
    setIncomes([]);
    setError("");
  }

  function logout() {
    setAuth(null);
    setExpenses([]);
    setIncomes([]);
    setActiveTab("Overview");
  }

  if (!auth) {
    return (
      <AuthPage onLogin={login} notice={error} darkMode={darkMode} />
    );
  }

  return (
    <div className={`app-shell ${darkMode ? "theme-dark" : ""}`}>
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-mark">p</span>
            <span>
              Pennywise<span className="brand-period">.</span>
            </span>
          </div>

          <p className="sidebar-label">MAIN MENU</p>

          {[
            { key: "Overview", name: "Home", icon: "⌂", className: "nav-home" },
            { key: "Charts", name: "Charts", icon: "◔", className: "nav-charts" },
            { key: "Add", name: "Add", icon: "＋", className: "nav-add" },
            { key: "Transactions", name: "Reports", icon: "▤", className: "nav-reports" },
            { key: "Profile", name: "Profile", icon: "◉", className: "nav-profile" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`nav-tab ${tab.className}${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? "page" : undefined}
            >
              <span className="nav-icon">{tab.icon}</span>
              {tab.name}
            </button>
          ))}

        </aside>

        <main className="dashboard">
          <section className="welcome-row">
            <div>
              <span className="eyebrow">PENNYWISE · PERSONAL CASHBOOK</span>

              <h1>Money Tracker</h1>

              <p className="muted">
                Good to see you, {auth.user?.name?.split(" ")[0] || "there"}! Here’s your financial snapshot for today.
              </p>
            </div>

            <div className="today-pill">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </section>

          {error && (
            <div className="notice error-message">{error}</div>
          )}

          {message && (
            <div className="notice success-message">{message}</div>
          )}

          {loading && (
            <div className="notice">Loading your financial data...</div>
          )}

          {activeTab === "Overview" && (
            <>
              <section className="overview-hero">
                <div className="overview-hero-copy">
                  <span className="eyebrow">TOTAL BALANCE</span>
                  <h2>{money(balance, currency)}</h2>
                  <p className="muted">
                    {money(totalIncome, currency)} income · {money(totalExpenses, currency)} expenses
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setActiveTab("Add")}
                  >
                    ＋ Add transaction
                  </button>
                </div>
                <img src={moneyIllustration} alt="" aria-hidden="true" />
                <div
                  className="budget-ring"
                  style={{ "--budget-progress": `${budgetPercent}%` }}
                  aria-label={`${Math.round(budgetPercent)} percent of monthly budget used`}
                >
                  <div>
                    <strong>{Math.round(budgetPercent)}%</strong>
                    <span>budget used</span>
                  </div>
                </div>
              </section>

              <section className="stats-grid">
                <StatCard
                  label="Total balance"
                  value={money(balance, currency)}
                  note="Income minus expenses"
                  icon="◈"
                  kind="balance-card"
                />

                <StatCard
                  label="Total expenses"
                  value={money(totalExpenses, currency)}
                  note={`${expenses.length} expense records`}
                  icon="↘"
                  kind="expense-card"
                />

                <StatCard
                  label="Total income"
                  value={money(totalIncome, currency)}
                  note={`${incomes.length} income records`}
                  icon="↗"
                  kind="income-card"
                />

                <StatCard
                  label="This month savings"
                  value={money(savings, currency)}
                  note={`${money(monthlyIncome, currency)} income this month`}
                  icon="✳"
                  kind="savings-card"
                />
              </section>

              <section className="content-grid">
                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">CASH FLOW</span>
                      <h2>Income & expenses</h2>
                    </div>
                    <span className="period-label">This month</span>
                  </div>

                  <div className="cashflow-grid">
                    <div className="cashflow-item">
                      <span className="legend-dot green-dot"></span>
                      <span>Income</span>
                      <strong>{money(monthlyIncome, currency)}</strong>

                      <div className="mini-track">
                        <span
                          style={{
                            width: `${monthlyIncome ? 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="cashflow-item">
                      <span className="legend-dot orange-dot"></span>
                      <span>Expenses</span>
                      <strong>{money(monthlyExpenses, currency)}</strong>

                      <div className="mini-track expense-track">
                        <span
                          style={{
                            width: `${
                              monthlyIncome
                                ? Math.min(
                                    100,
                                    (monthlyExpenses / monthlyIncome) * 100
                                  )
                                : monthlyExpenses
                                  ? 100
                                  : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="cashflow-summary">
                    <span>Net cash flow</span>
                    <strong
                      className={savings < 0 ? "negative" : "positive"}
                    >
                      {money(savings, currency)}
                    </strong>
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">MONTHLY LIMIT</span>
                      <h2>Budget tracker</h2>
                    </div>
                    <span className="budget-icon">◎</span>
                  </div>

                  <div className="budget-numbers">
                    <strong>{money(monthlyExpenses, currency)}</strong>
                    <span>of {money(budget, currency)}</span>
                  </div>

                  <div className="progress-track">
                    <span
                      className={
                        budgetPercent >= 100
                          ? "progress-fill over-budget"
                          : "progress-fill"
                      }
                      style={{ width: `${budgetPercent}%` }}
                    />
                  </div>

                  <p
                    className={
                      monthlyExpenses > budget
                        ? "negative budget-note"
                        : "muted budget-note"
                    }
                  >
                    {monthlyExpenses > budget
                      ? `You've exceeded your budget by ${money(
                          monthlyExpenses - budget,
                          currency
                        )}.`
                      : `${money(
                          budget - monthlyExpenses,
                          currency
                        )} remaining this month.`}
                  </p>

                  <button
                    className="secondary-button"
                    onClick={() => setActiveTab("Budget planner")}
                  >
                    Manage budget →
                  </button>
                </article>

                <article className="panel category-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">SPENDING BREAKDOWN</span>
                      <h2>Top categories</h2>
                    </div>
                    <span className="period-label">This month</span>
                  </div>

                  {categoryTotals.length === 0 ? (
                    <p className="empty-state">
                      Add an expense to see your category breakdown.
                    </p>
                  ) : (
                    categoryTotals.slice(0, 6).map(
                      ([category, amount], index) => {
                        const percent = monthlyExpenses
                          ? (amount / monthlyExpenses) * 100
                          : 0;

                        return (
                          <div className="category-row" key={category}>
                            <div className="category-meta">
                              <span
                                className={`category-dot dot-${index % 5}`}
                              />
                              <span>{category}</span>
                              <strong>{money(amount, currency)}</strong>
                            </div>

                            <div className="category-track">
                              <span
                                className={`bar-${index % 5}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </article>

                <article className="panel quick-add-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">QUICK ENTRY</span>
                      <h2>Add an expense</h2>
                    </div>
                    <span className="quick-icon">＋</span>
                  </div>

                  <EntryForm
                    type="expense"
                    onSave={(data) => saveEntry("expense", data)}
                    busy={busy}
                  />
                </article>

                <article className="panel quick-add-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">MONEY IN</span>
                      <h2>Add income</h2>
                    </div>
                    <span className="quick-icon income-quick">↗</span>
                  </div>

                  <EntryForm
                    type="income"
                    onSave={(data) => saveEntry("income", data)}
                    busy={busy}
                  />
                </article>

                <article className="panel recent-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">LATEST ACTIVITY</span>
                      <h2>Recent transactions</h2>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActiveTab("Transactions")}
                    >
                      View all →
                    </button>
                  </div>

                  <TransactionTable
                    entries={allEntries.slice(0, 5)}
                    currency={currency}
                    onDelete={deleteEntry}
                  />
                </article>
              </section>
            </>
          )}

          {activeTab === "Charts" && (
            <section className="panel charts-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">YOUR MONEY, VISUALIZED</span>
                  <h2>Charts</h2>
                </div>
                <strong className="chart-total">{money(chartTotal, currency)}</strong>
              </div>

              <div className="chart-controls">
                <div className="chart-type-switch" role="group" aria-label="Chart type">
                  {["Expense", "Income"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={chartType === type ? "selected" : ""}
                      onClick={() => setChartType(type)}
                      aria-pressed={chartType === type}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <select
                  value={chartPeriod}
                  onChange={(event) => setChartPeriod(event.target.value)}
                  aria-label="Chart period"
                >
                  {["Week", "Month", "Year"].map((period) => (
                    <option key={period}>{period}</option>
                  ))}
                </select>
              </div>

              {chartCategoryTotals.length === 0 ? (
                <div className="chart-empty">
                  <span aria-hidden="true">▥</span>
                  <p>No {chartType.toLowerCase()} records for this {chartPeriod.toLowerCase()}.</p>
                </div>
              ) : (
                <div className="chart-bars">
                  {chartCategoryTotals.map(([category, amount], index) => (
                    <div className="chart-bar-item" key={category}>
                      <strong>{money(amount, currency)}</strong>
                      <div className="chart-bar-track">
                        <span
                          className={`chart-bar-fill chart-bar-${index % 5}`}
                          style={{
                            height: `${maxChartAmount ? (amount / maxChartAmount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="chart-bar-label">{category}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "Add" && (
            <section className="panel add-entry-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">RECORD A TRANSACTION</span>
                  <h2>Add to your cashbook</h2>
                </div>
                <span className="quick-icon">＋</span>
              </div>

              <div className="chart-type-switch entry-type-switch" role="group" aria-label="Transaction type">
                {[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={addType === type.value ? "selected" : ""}
                    onClick={() => setAddType(type.value)}
                    aria-pressed={addType === type.value}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <EntryForm
                key={addType}
                type={addType}
                onSave={(data) => saveEntry(addType, data)}
                busy={busy}
                showCategoryGrid
              />
            </section>
          )}

          {activeTab === "Transactions" && (
            <section className="panel transactions-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">REVIEW YOUR ACTIVITY</span>
                  <h2>Reports</h2>
                </div>

                <button className="primary-button" onClick={exportCSV}>
                  Export filtered CSV
                </button>
              </div>

              <div className="filters-row">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions..."
                />

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {["All", "Income", "Expense"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option>All</option>
                  {CATEGORIES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>

                <input
                  type="month"
                  value={monthFilter === "all" ? "" : monthFilter}
                  onChange={(e) =>
                    setMonthFilter(e.target.value || "all")
                  }
                />
              </div>

              <TransactionTable
                entries={filteredEntries}
                currency={currency}
                onDelete={deleteEntry}
              />

              <p className="muted result-count">
                Showing {filteredEntries.length} transaction(s).
              </p>
            </section>
          )}

          {activeTab === "Budget planner" && (
            <section className="budget-layout">
              <article className="panel budget-editor">
                <span className="eyebrow">PLAN AHEAD</span>
                <h2>Your monthly budget</h2>

                <p className="muted">
                  Choose a spending limit and track your progress throughout
                  the month.
                </p>

                <label>
                  Monthly spending budget ({currency})
                  <input
                    type="number"
                    min="1"
                    value={budget}
                    onChange={(e) =>
                      setBudget(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </label>

                <div className="budget-big-number">
                  {money(monthlyExpenses, currency)}{" "}
                  <span>spent</span>
                </div>

                <div className="progress-track large-progress">
                  <span
                    className={
                      budgetPercent >= 100
                        ? "progress-fill over-budget"
                        : "progress-fill"
                    }
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>

                <p
                  className={
                    monthlyExpenses > budget ? "negative" : "muted"
                  }
                >
                  {Math.round(budgetPercent)}% of your monthly budget used
                </p>

                {monthlyExpenses > budget && (
                  <div className="notice warning-message">
                    Budget alert: spending is over your limit.
                  </div>
                )}
              </article>

              <article className="panel budget-editor">
                <span className="eyebrow">SAVE WITH PURPOSE</span>
                <h2>Savings goal</h2>

                <p className="muted">
                  Set a monthly savings target and check how close you are.
                </p>

                <label>
                  Monthly savings goal ({currency})
                  <input
                    type="number"
                    min="1"
                    value={goal}
                    onChange={(e) =>
                      setGoal(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </label>

                <div className="budget-big-number">
                  {money(Math.max(0, savings), currency)}{" "}
                  <span>saved this month</span>
                </div>

                <div className="progress-track large-progress">
                  <span
                    className="goal-progress-fill"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>

                <p className="muted">
                  {Math.round(goalPercent)}% of your savings goal reached
                </p>
              </article>
            </section>
          )}

          {activeTab === "Profile" && (
            <section className="profile-layout">
              <article className="panel profile-summary">
                <span className="profile-avatar" aria-hidden="true">
                  {auth.user?.name?.trim()?.[0]?.toUpperCase() || "U"}
                </span>
                <div>
                  <span className="eyebrow">PERSONAL CASHBOOK</span>
                  <h2>{auth.user?.name || "Your profile"}</h2>
                  <p className="muted">{auth.user?.email || ""}</p>
                </div>
              </article>

              <article className="panel profile-actions">
                <h2>Account</h2>
                <button className="profile-action" onClick={() => setActiveTab("Settings")}>
                  <span className="profile-action-icon">⚙</span>
                  <span><strong>Settings</strong><small>Currency and appearance</small></span>
                  <span aria-hidden="true">›</span>
                </button>
                <button className="profile-action" onClick={() => setActiveTab("Budget planner")}>
                  <span className="profile-action-icon">◎</span>
                  <span><strong>Budget</strong><small>Monthly limit and savings goal</small></span>
                  <span aria-hidden="true">›</span>
                </button>
                <button className="profile-action" onClick={exportCSV}>
                  <span className="profile-action-icon">⇩</span>
                  <span><strong>Export data</strong><small>Download your transactions</small></span>
                  <span aria-hidden="true">›</span>
                </button>
                <button className="profile-action profile-signout" onClick={logout}>
                  <span className="profile-action-icon">↪</span>
                  <span><strong>Sign out</strong><small>End this session</small></span>
                  <span aria-hidden="true">›</span>
                </button>
              </article>
            </section>
          )}

          {activeTab === "Settings" && (
            <section className="panel settings-panel">
              <span className="eyebrow">MAKE IT YOURS</span>
              <h2>Preferences & settings</h2>

              <div className="settings-row">
                <div>
                  <strong>Profile</strong>
                  <p className="muted">Your account details</p>
                </div>

                <div className="settings-value">
                  <strong>{auth.user?.name || "User"}</strong>
                  <span>{auth.user?.email || ""}</span>
                </div>
              </div>

              <div className="settings-row">
                <div>
                  <strong>Display currency</strong>
                  <p className="muted">
                    Choose how amounts are displayed
                  </p>
                </div>

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — Pound (£)</option>
                </select>
              </div>

              <div className="settings-row">
                <div>
                  <strong>Dark mode</strong>
                  <p className="muted">
                    Use a darker dashboard appearance
                  </p>
                </div>

                <button
                  className={
                    darkMode
                      ? "toggle-button enabled"
                      : "toggle-button"
                  }
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? "On" : "Off"}
                </button>
              </div>

              <div className="settings-row">
                <div>
                  <strong>Sign out</strong>
                  <p className="muted">
                    End your current session on this device
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={logout}
                >
                  Sign out
                </button>
              </div>

              <p className="muted settings-footnote">
                Budget, currency and appearance preferences are saved in
                this browser.
              </p>
            </section>
          )}

          <footer className="dashboard-footer">
            <span>✳ Pennywise</span>
            <span>Small steps. Smarter money.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;