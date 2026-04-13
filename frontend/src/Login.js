import { useState, useEffect } from "react";
import "./Login.css";
import { frontendMetrics, frontendLogger } from "./tracing";

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Track page view when Login page loads
  useEffect(() => {
    frontendMetrics.loginPageViews.add(1);
    frontendLogger.emit({
      severityText: 'INFO',
      body: 'User opened Login page',
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Track form submission
    frontendMetrics.loginSubmits.add(1);
    frontendLogger.emit({
      severityText: 'INFO',
      body: `Login form submitted for: ${emailOrUsername}`,
      attributes: { emailOrUsername },
    });

    const res = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const data = await res.text();
    setMessage(data);

    // Track success or fail
    if (data.includes("successful")) {
      frontendMetrics.loginSuccess.add(1);
      frontendLogger.emit({
        severityText: 'INFO',
        body: `Login SUCCESS for: ${emailOrUsername}`,
        attributes: { emailOrUsername },
      });
    } else {
      frontendMetrics.loginFail.add(1);
      frontendLogger.emit({
        severityText: 'WARN',
        body: `Login FAILED for: ${emailOrUsername} — reason: ${data}`,
        attributes: { emailOrUsername, reason: data },
      });
    }
  };

  return (
    <div className="form-container">
      <h2>🌸 Welcome Back</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Username or Email" onChange={e => setEmailOrUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button type="submit">Login 💕</button>
      </form>
      {message && <p className={message.includes("successful") ? "message success" : "message error"}>{message}</p>}
    </div>
  );
}
