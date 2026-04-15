require('dotenv').config();

process.env.OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'signup-backend';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const logsAPI = require('@opentelemetry/api-logs');
const { resourceFromAttributes } = require('@opentelemetry/resources');

const NGROK_URL = process.env.NGROK_URL;
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME;

console.log(`OTel starting — service: ${SERVICE_NAME}, collector: ${NGROK_URL}`);

// RESOURCE — this is what was missing for logs and metrics
const resource = resourceFromAttributes({
  'service.name': SERVICE_NAME,
});

// 1. TRACES
const traceExporter = new OTLPTraceExporter({
  url: `${NGROK_URL}/v1/traces`,
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// 2. METRICS
const metricExporter = new OTLPMetricExporter({
  url: `${NGROK_URL}/v1/metrics`,
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

module.exports.metrics = {
  loginCounter,
  signupCounter,
  loginSuccessCounter,
  loginFailCounter,
};

// 3. LOGS
const logExporter = new OTLPLogExporter({
  url: `${NGROK_URL}/v1/logs`,
});

const loggerProvider = new LoggerProvider({
  resource,
  processors: [new BatchLogRecordProcessor(logExporter)],
});

logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

const logger = loggerProvider.getLogger(SERVICE_NAME);

module.exports.logger = logger;

console.log(`OpenTelemetry traces + metrics + logs started for: ${SERVICE_NAME}`);
