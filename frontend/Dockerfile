# frontend/Dockerfile

# Use Node LTS image
FROM node:18

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend code
COPY . .

# Build frontend for production
RUN npm run build

# Use Nginx to serve build files
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
