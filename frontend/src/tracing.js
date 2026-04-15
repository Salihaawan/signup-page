  // ── NEW LINE (propagator added here) ──────────────────────
import { W3CTraceContextPropagator } from '@opentelemetry/core';

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import * as logsAPI from '@opentelemetry/api-logs';
import * as api from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';

const SERVICE_NAME = process.env.REACT_APP_OTEL_SERVICE_NAME || 'signup-frontend';
const NGROK_URL = process.env.REACT_APP_NGROK_URL;

console.log(`Frontend OTel starting — service: ${SERVICE_NAME}, collector: ${NGROK_URL}`);

const resource = resourceFromAttributes({
  'service.name': SERVICE_NAME,
});

// 1. TRACES
const traceExporter = new OTLPTraceExporter({
  url: `${NGROK_URL}/v1/traces`,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

const tracerProvider = new WebTracerProvider({
  resource,
  spanProcessors: [new SimpleSpanProcessor(traceExporter)],
});

tracerProvider.register({
  contextManager: new ZoneContextManager(),
    // ── NEW LINE (propagator added here) ──────────────────────
   propagator: new W3CTraceContextPropagator(),
});

// ── NEW EXPORT (added here so Login.js and Signup.js can inject headers) ──
export const propagator = new W3CTraceContextPropagator();

// Export tracer so components can create spans manually
export const tracer = api.trace.getTracer(SERVICE_NAME);

// 2. METRICS
const metricExporter = new OTLPMetricExporter({
  url: `${NGROK_URL}/v1/metrics`,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

const meterProvider = new MeterProvider({
  resource,
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000,
    }),
  ],
});

const meter = meterProvider.getMeter(SERVICE_NAME);

export const frontendMetrics = {
  loginPageViews: meter.createCounter('frontend_login_page_views', {
    description: 'Number of times login page was loaded',
  }),
  signupPageViews: meter.createCounter('frontend_signup_page_views', {
    description: 'Number of times signup page was loaded',
  }),
  loginSubmits: meter.createCounter('frontend_login_submits', {
    description: 'Number of login form submissions',
  }),
  signupSubmits: meter.createCounter('frontend_signup_submits', {
    description: 'Number of signup form submissions',
  }),
  loginSuccess: meter.createCounter('frontend_login_success', {
    description: 'Number of successful logins from frontend',
  }),
  loginFail: meter.createCounter('frontend_login_fail', {
    description: 'Number of failed logins from frontend',
  }),
};

// 3. LOGS
const logExporter = new OTLPLogExporter({
  url: `${NGROK_URL}/v1/logs`,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

const loggerProvider = new LoggerProvider({
  resource,
  processors: [new BatchLogRecordProcessor(logExporter)],
});

logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

export const frontendLogger = loggerProvider.getLogger(SERVICE_NAME);

console.log(`Frontend OpenTelemetry started for service: ${SERVICE_NAME}`);
