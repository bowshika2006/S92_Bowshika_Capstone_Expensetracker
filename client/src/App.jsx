import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

import Header from "./components/Header";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";

function App() {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState("");

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoginError("");

      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Google login failed");
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);

      console.log("Google login successful:", data.user);
    } catch (error) {
      console.error("Google login error:", error);
      setLoginError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
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
              onError={() => {
                setLoginError("Google Login Failed");
              }}
            />

            {loginError && (
              <p style={{ color: "red" }}>
                {loginError}
              </p>
            )}
          </>
        ) : (
          <>
            <h3>Welcome, {user.name} 👋</h3>
            <p>{user.email}</p>

            <button onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>

      <ExpenseForm />
      <ExpenseList />
    </>
  );
}

export default App;