const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'https://unheard-michaele-chally.ngrok-free.dev/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();