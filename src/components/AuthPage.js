import { useState } from "react";

function AuthPage({ onLogin, onClose }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const resetMessage = () => {
    setMessage("");
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    resetMessage();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = isRegister
        ? "http://localhost:5000/api/auth/register"
        : "http://localhost:5000/api/auth/login";

      const body = isRegister
        ? {
            username: username.trim(),
            email: email.trim(),
            password,
          }
        : {
            usernameOrEmail: usernameOrEmail.trim(),
            password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (isRegister) {
        setMessage("Account created successfully. You can now log in.");
        setMode("login");
        setUsernameOrEmail(username);
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        localStorage.setItem(
          "MatchesUser",
          JSON.stringify({
            userId: data.userId,
            username: data.username,
            email: data.email,
            likedItems: data.likedItems || [],
          })
        );

        onLogin({
          userId: data.userId,
          username: data.username,
          email: data.email,
          likedItems: data.likedItems || [],
        });
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <button
          type="button"
          className="auth-close-button"
          onClick={onClose}
          aria-label="Close authentication form"
        >
          ×
        </button>

        <div className="auth-heading">
          <p className="auth-eyebrow">Matches</p>
          <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p>
            {isRegister
              ? "Save favourites and build your personal fashion profile."
              : "Log in to continue discovering fashion selected for you."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <>
              <label>
                Username
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  minLength={3}
                  placeholder="Choose a username"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="name@example.com"
                />
              </label>
            </>
          ) : (
            <label>
              Username or email
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(event) =>
                  setUsernameOrEmail(event.target.value)
                }
                required
                placeholder="Enter your username or email"
              />
            </label>
          )}

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="Enter your password"
            />
          </label>

          {message && <p className="auth-message">{message}</p>}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
              ? "Create account"
              : "Log in"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch-button"
          onClick={switchMode}
        >
          {isRegister
            ? "Already have an account? Log in"
            : "New to Matches? Create an account"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;