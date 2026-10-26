
import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";

import Header from "./components/Header";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";

function App() {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expenseError, setExpenseError] = useState("");

  const token = localStorage.getItem("token");

  const loadExpenses = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/expenses", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load expenses");

      setExpenses(Array.isArray(data) ? data : data.expenses || []);
    } catch (error) {
      setExpenseError(error.message);
    }
  };

  useEffect(() => {
    if (token) loadExpenses();
  }, []);

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoginError("");

      const response = await fetch("http://127.0.0.1:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Google login failed");

      localStorage.setItem("token", data.token);
      setUser(data.user);
      await loadExpenses();
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleAddExpense = async (expense) => {
    try {
      setExpenseError("");
      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        setExpenseError("Please login with Google before adding expenses.");
        return;
      }

      const response = await fetch("http://127.0.0.1:5000/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(expense),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add expense");

      await loadExpenses();
    } catch (error) {
      setExpenseError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setExpenses([]);
  };

  return (
    <>
      <Header />

      <div style={{ textAlign: "center", margin: "20px" }}>
        {!user ? (
          <>
            <h2>Login with Google</h2>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setLoginError("Google Login Failed")}
            />
            {loginError && <p style={{ color: "red" }}>{loginError}</p>}
          </>
        ) : (
          <>
            <h3>Welcome, {user.name} 👋</h3>
            <p>{user.email}</p>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>

      <ExpenseForm onAddExpense={handleAddExpense} />
      {expenseError && <p style={{ color: "red", textAlign: "center" }}>{expenseError}</p>}
      <ExpenseList expenses={expenses} />
    </>
  );
}

export default App;
