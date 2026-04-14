FROM node:18

WORKDIR /app

# Copy only dependency files first (better caching)
COPY package*.json ./

# Install dependencies (stable build)
RUN npm ci

# Copy full project
COPY . .

# Install OTEL dependencies ONCE (pinned versions = stable)
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

# Environment variables
ENV OTEL_SERVICE_NAME=signup-backend
ENV OTEL_RESOURCE_ATTRIBUTES=service.name=signup-backend

EXPOSE 5000

CMD ["node", "server.js"]
