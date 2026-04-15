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
          try {
      const responseSpan = tracer.startSpan('response-backend-to-frontend', {}, ctx);
      const responseCtx = api.trace.setSpan(ctx, responseSpan);

      const res = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ emailOrUsername, password }),
      });

      // ── child span 1: response received from backend ──
      const receivedSpan = tracer.startSpan('response-received', {}, responseCtx);
      receivedSpan.setAttribute('http.status_code', res.status);
      receivedSpan.setAttribute('http.method', 'POST');
      receivedSpan.setAttribute('http.url', '/login');
      receivedSpan.end();

      // ── child span 2: parse response body ──
      const parseSpan = tracer.startSpan('response-parsed', {}, responseCtx);
      const data = await res.text();
      parseSpan.setAttribute('response.message', data);
      parseSpan.end();

      // ── child span 3: update UI ──
      const uiSpan = tracer.startSpan('ui-updated', {}, responseCtx);
      setMessage(data);
      uiSpan.setAttribute('login.result', data.includes("successful") ? 'success' : 'failed');
      uiSpan.end();

      span.setAttribute('response.message', data);
      span.setAttribute('response.status', res.status);

      if (data.includes("successful")) {
        frontendMetrics.loginSuccess.add(1);
        frontendLogger.emit({
          severityText: 'INFO',
          body: `Login SUCCESS for: ${emailOrUsername}`,
          attributes: { emailOrUsername },
        });
        span.setAttribute('login.result', 'success');
        responseSpan.setAttribute('login.result', 'success');
      } else {
        frontendMetrics.loginFail.add(1);
        frontendLogger.emit({
          severityText: 'WARN',
          body: `Login FAILED for: ${emailOrUsername} — reason: ${data}`,
          attributes: { emailOrUsername, reason: data },
        });
        span.setAttribute('login.result', 'failed');
        span.setAttribute('login.reason', data);
        responseSpan.setAttribute('login.result', 'failed');
      }

      responseSpan.end();

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
