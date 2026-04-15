import { useState, useEffect } from "react";
import "./Signup.css";
// ── UPDATED IMPORT (added propagator and context imports here) ──
import { frontendMetrics, frontendLogger, tracer, propagator } from "./tracing";
import * as api from '@opentelemetry/api';
// ───────────────────────────────────────────────────────────────

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const span = tracer.startSpan('signup-page-view');
    frontendMetrics.signupPageViews.add(1);
    frontendLogger.emit({
      severityText: 'INFO',
      body: 'User opened Signup page',
    });
    span.end();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const span = tracer.startSpan('signup-form-submit');
    span.setAttribute('user', username);

    // ── inject traceparent header into fetch so backend continues same trace ──
    const ctx = api.trace.setSpan(api.context.active(), span);
    const headers = {
      "Content-Type": "application/json",
    };
    propagator.inject(ctx, headers, {
      set: (carrier, key, value) => {
        carrier[key] = value;
      }
    });
    // ─────────────────────────────────────────────────────────────────────────

    frontendMetrics.signupSubmits.add(1);
    frontendLogger.emit({
      severityText: 'INFO',
      body: `Signup form submitted for: ${username}`,
      attributes: { username, email },
    });

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/signup`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ username, email, password }),
      });

      // ── response time tracking using span attributes ──
      const responseStartTime = Date.now();
      const data = await res.text();
      const responseEndTime = Date.now();
      setMessage(data);

      // ── add response timing directly on main span ──
      span.setAttribute('response.received.ms', responseEndTime - responseStartTime);
      span.setAttribute('response.message', data);
      span.setAttribute('response.status', res.status);
      span.setAttribute('user.username', username);
      span.setAttribute('user.email', email);

      frontendLogger.emit({
        severityText: data.includes("created") ? 'INFO' : 'WARN',
        body: `Signup result for ${username}: ${data}`,
        attributes: { username, email, result: data },
      });

      span.setAttribute('signup.result', data.includes("created") ? 'success' : 'failed');
      // ─────────────────────────────────────────────────────────────────

    } catch (err) {
      span.setAttribute('error', true);
      span.setAttribute('error.message', err.message);
    } finally {
      span.end();
    }
  };

  return (
    <div className="form-container">
      <h2>🌸 Create Your Account</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button type="submit">Signup 💕</button>
      </form>
      {message && <p className="message success">{message}</p>}
    </div>
  );
}
