const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');

const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');

const logsAPI = require('@opentelemetry/api-logs');

// =============================
// NGROK URL
// =============================
const NGROK_URL = 'https://976f-103-137-71-18.ngrok-free.app';

// =============================
// TRACES SETUP
// =============================
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

// =============================
// METRICS SETUP
// =============================
const metricExporter = new OTLPMetricExporter({
  url: `${NGROK_URL}/v1/metrics`,
});

const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000,
    }),
  ],
});

const meter = meterProvider.getMeter('signup-backend');

const loginCounter = meter.createCounter('login_requests_total');
const signupCounter = meter.createCounter('signup_requests_total');
const loginSuccessCounter = meter.createCounter('login_success_total');
const loginFailCounter = meter.createCounter('login_fail_total');

module.exports.metrics = {
  loginCounter,
  signupCounter,
  loginSuccessCounter,
  loginFailCounter,
};

// =============================
// LOGS SETUP
// =============================
const logExporter = new OTLPLogExporter({
  url: `${NGROK_URL}/v1/logs`,
});

const loggerProvider = new LoggerProvider({
  processors: [
    new BatchLogRecordProcessor(logExporter),
  ],
});

// IMPORTANT FIX (required)
logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

const logger = loggerProvider.getLogger('signup-backend');

module.exports.logger = logger;

console.log("✅ OpenTelemetry tracing + metrics + logs started");
