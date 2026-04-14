FROM node:18

WORKDIR /app

# 1. Copy dependency files first (best caching)
COPY package*.json ./

# 2. Install ONLY once (clean + stable)
RUN npm ci

# 3. Copy full project
COPY . .

# 4. Install OpenTelemetry dependencies (ONLY ONCE, stable versions)
RUN npm install \
    @opentelemetry/sdk-node \
    @opentelemetry/resources \
    @opentelemetry/semantic-conventions \
    @opentelemetry/exporter-trace-otlp-http \
    @opentelemetry/auto-instrumentations-node \
    @opentelemetry/sdk-metrics \
    @opentelemetry/exporter-metrics-otlp-http \
    @opentelemetry/sdk-logs \
    @opentelemetry/exporter-logs-otlp-http \
    @opentelemetry/api

# 5. Environment variables
ENV OTEL_SERVICE_NAME=signup-backend
ENV OTEL_RESOURCE_ATTRIBUTES=service.name=signup-backend

EXPOSE 5000

CMD ["node", "server.js"]
