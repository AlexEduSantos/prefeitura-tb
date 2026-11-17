# Build stage
FROM node:22-alpine AS builder

RUN apk add --no-cache ffmpeg

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using npm
RUN npm install

# Copy application code
COPY . .

# Expose the application port
EXPOSE 3001

# Start the application
CMD [ "npm", "run", "start:prod" ]
