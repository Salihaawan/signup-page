import { useState } from "react";
import "./Login.css";

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://52.11.164.169:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    const data = await res.text();
    setMessage(data);
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