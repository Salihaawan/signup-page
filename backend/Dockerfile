FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install @opentelemetry/sdk-metrics \
    @opentelemetry/exporter-metrics-otlp-http \
    @opentelemetry/sdk-logs \
    @opentelemetry/exporter-logs-otlp-http \
    @opentelemetry/api

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
