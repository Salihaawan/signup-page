FROM node:18

# Set working directory
WORKDIR /app

# Copy root package.json for dependencies
COPY ../package*.json ./

# Install dependencies
RUN npm install

COPY .env ./
# Copy backend code
COPY . .

# Expose port
EXPOSE 5000

# Start backend
CMD ["node", "server.js"]
