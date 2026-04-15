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
    // Manual span for page view
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

    // Manual span for signup request
    const span = tracer.startSpan('signup-form-submit');
    span.setAttribute('user', username);

    // ── NEW BLOCK (inject traceparent header into fetch so backend continues same trace) ──
    const ctx = api.trace.setSpan(api.context.active(), span);
    const headers = {
      "Content-Type": "application/json",
    };
    propagator.inject(ctx, headers, {
      set: (carrier, key, value) => { carrier[key] = value; }
    });
    // ─────────────────────────────────────────────────────────────────────────────────────
    
    frontendMetrics.signupSubmits.add(1);
    frontendLogger.emit({
      severityText: 'INFO',
      body: `Signup form submitted for: ${username}`,
      attributes: { username, email },
    });

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/signup`, {
        method: "POST",
        // ── UPDATED (headers now includes traceparent alongside Content-Type) ──
        headers: headers,
        // ───────────────────────────────────────────────────────────────────────
        body: JSON.stringify({ username, email, password }),
      });

      // ── NEW SPAN (wraps response processing — from backend reply to UI display) ──
      const responseSpan = tracer.startSpan('signup-response-processing', {}, ctx);
      // ─────────────────────────────────────────────────────────────────────────────
      
      const data = await res.text();
      setMessage(data);

      frontendLogger.emit({
        severityText: data.includes("created") ? 'INFO' : 'WARN',
        body: `Signup result for ${username}: ${data}`,
        attributes: { username, email, result: data },
      });

      span.setAttribute('signup.result', data.includes("created") ? 'success' : 'failed');
      // ── NEW (mark response span with result) ──
      responseSpan.setAttribute('signup.result', data.includes("created") ? 'success' : 'failed');
      responseSpan.setAttribute('response.message', data);
      responseSpan.setAttribute('user.username', username);
      responseSpan.setAttribute('user.email', email);
      // ─────────────────────────────────────────

      // ── NEW (close response span here after UI updated) ──
      responseSpan.end();
      // ─────────────────────────────────────────────────────
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
