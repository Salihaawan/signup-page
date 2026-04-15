FROM node:20 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install @opentelemetry/sdk-trace-web \
    @opentelemetry/exporter-trace-otlp-http \
    @opentelemetry/auto-instrumentations-web \
    @opentelemetry/context-zone \
    @opentelemetry/sdk-metrics \
    @opentelemetry/exporter-metrics-otlp-http \
    @opentelemetry/sdk-logs \
    @opentelemetry/exporter-logs-otlp-http \
    @opentelemetry/api-logs \
    @opentelemetry/api \
    @opentelemetry/resources

COPY . .

ARG REACT_APP_API_URL
ARG REACT_APP_OTEL_SERVICE_NAME
ARG REACT_APP_NGROK_URL

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_OTEL_SERVICE_NAME=$REACT_APP_OTEL_SERVICE_NAME
ENV REACT_APP_NGROK_URL=$REACT_APP_NGROK_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
