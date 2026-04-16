import { useState, useEffect } from "react";
import "./Login.css";
import { frontendMetrics, frontendLogger, tracer, propagator } from "./tracing";
import * as api from '@opentelemetry/api';

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const span = tracer.startSpan('login-page-view');
    frontendMetrics.loginPageViews.add(1);
    frontendLogger.emit({
      severityText: 'INFO',
      body: 'User opened Login page',
    });
    span.end();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const span = tracer.startSpan('login-form-submit');
    span.setAttribute('user', emailOrUsername);

    const ctx = api.trace.setSpan(api.context.active(), span);
    const headers = {
      "Content-Type": "application/json",
    };
    propagator.inject(ctx, headers, {
      set: (carrier, key, value) => {
        carrier[key] = value;
      }
    });

    frontendMetrics.loginSubmits.add(1);
    frontendLogger.emit({
      severityText: 'INFO',
      body: `Login form submitted for: ${emailOrUsername}`,
      attributes: { emailOrUsername },
    });

    try {
      const responseSpan = tracer.startSpan('response-backend-to-frontend', {}, ctx);
      const responseCtx = api.trace.setSpan(ctx, responseSpan);

      const res = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const receivedSpan = tracer.startSpan('response-received', {}, responseCtx);
      receivedSpan.setAttribute('http.status_code', res.status);
      receivedSpan.setAttribute('http.method', 'POST');
      receivedSpan.setAttribute('http.url', '/login');
      receivedSpan.end();

      const parseSpan = tracer.startSpan('response-parsed', {}, responseCtx);
      const data = await res.text();
      parseSpan.setAttribute('response.message', data);
      parseSpan.end();

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
      <h2>Welcome Back</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Username or Email" onChange={e => setEmailOrUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      {message && <p className={message.includes("successful") ? "message success" : "message error"}>{message}</p>}
    </div>
  );
}
