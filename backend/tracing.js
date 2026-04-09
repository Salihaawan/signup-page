const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://172.31.74.150:4319/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
