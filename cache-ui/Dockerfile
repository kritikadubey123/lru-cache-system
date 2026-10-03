# Use official Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the React code
COPY . .

# Expose Vite's default port and run it
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]