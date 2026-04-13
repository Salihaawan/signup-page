FROM node:18

# Set working directory
WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install @opentelemetry/sdk-metrics \
    @opentelemetry/exporter-metrics-otlp-http \
    @opentelemetry/sdk-logs \
    @opentelemetry/exporter-logs-otlp-http \
    @opentelemetry/api-logs

COPY .env ./
# Copy backend code
COPY . .

# Expose port
EXPOSE 5000

# Start backend
CMD ["node", "server.js"]
