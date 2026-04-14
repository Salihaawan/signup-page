// ─── TRACES ───────────────────────────────────────────────
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';

// ─── METRICS ──────────────────────────────────────────────
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

// ─── LOGS ─────────────────────────────────────────────────
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import * as logsAPI from '@opentelemetry/api-logs';

const SERVICE_NAME = 'signup-frontend';
const NGROK_URL = 'https://976f-103-137-71-18.ngrok-free.app';

// 1. TRACES
const traceExporter = new OTLPTraceExporter({
  url: `${NGROK_URL}/v1/traces`,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

const tracerProvider = new WebTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(traceExporter)],
});
tracerProvider.resource.attributes['service.name'] = 'signup-frontend';

tracerProvider.register({
  contextManager: new ZoneContextManager(),
});

// 2. METRICS
const metricExporter = new OTLPMetricExporter({
  url: `${NGROK_URL}/v1/metrics`,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

const meterProvider = new MeterProvider({
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
  processors: [new BatchLogRecordProcessor(logExporter)],
});
loggerProvider.resource.attributes['service.name'] = 'signup-frontend';

logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

export const frontendLogger = loggerProvider.getLogger(SERVICE_NAME);

console.log('Frontend OpenTelemetry traces + metrics + logs started...');
