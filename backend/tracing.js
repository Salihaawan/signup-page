const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');

const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');

const NGROK_URL = 'https://976f-103-137-71-18.ngrok-free.app';

// ─── TRACES ───
const traceExporter = new OTLPTraceExporter({
  url: `${NGROK_URL}/v1/traces`,
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'signup-backend',
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// ══════════════════════════════════════════════════════════
// 2. METRICS SETUP
// Sends every 10 seconds:
//   - How many requests hit /login
//   - How many requests hit /signup
//   - Response times
// ══════════════════════════════════════════════════════════
const metricExporter = new OTLPMetricExporter({
  url: `${NGROK_URL}/v1/metrics`
});

const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000, // send metrics every 10 seconds
    }),
  ],
});

// Make this meter available globally in your app
const meter = meterProvider.getMeter('signup-backend');

// These are the actual metric counters your app will use
const loginCounter = meter.createCounter('login_requests_total', {
  description: 'Total number of login attempts',
});

const signupCounter = meter.createCounter('signup_requests_total', {
  description: 'Total number of signup attempts',
});

const loginSuccessCounter = meter.createCounter('login_success_total', {
  description: 'Total successful logins',
});

const loginFailCounter = meter.createCounter('login_fail_total', {
  description: 'Total failed logins',
});

// Export counters so server.js can use them
module.exports.metrics = {
  loginCounter,
  signupCounter,
  loginSuccessCounter,
  loginFailCounter,
};

// ══════════════════════════════════════════════════════════
// 3. LOGS SETUP
// Sends: all your console.log messages to collector
// So LOGIN_SUCCESS, SIGNUP_FAILED etc appear in SigNoz
// ══════════════════════════════════════════════════════════
const logExporter = new OTLPLogExporter({
  url: `${NGROK_URL}/v1/logs`
});

const loggerProvider = new LoggerProvider({
  processors: [new BatchLogRecordProcessor(logExporter)],
});

// Register globally
logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

const logger = loggerProvider.getLogger('signup-backend');

// Export logger so server.js can use it
module.exports.logger = logger;

console.log("OpenTelemetry traces + metrics + logs started...");
