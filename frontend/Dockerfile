FROM node:20 AS build

WORKDIR /app

# Copy root package.json for dependencies
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install @opentelemetry/sdk-trace-web \
    @opentelemetry/exporter-trace-otlp-http \
    @opentelemetry/auto-instrumentations-web \
    @opentelemetry/context-zone
    
# Copy frontend folder
COPY . .
COPY .env ./

# Build React app
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
