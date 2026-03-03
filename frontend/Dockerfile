FROM node:18 AS build

WORKDIR /app

# Copy root package.json for dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend folder
COPY . .

# Build React app
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
