# Use a Node.js base image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Install dependencies for file watching
RUN apk add --no-cache libc6-compat

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set proper permissions for the app directory
RUN chown -R node:node /app
USER node

# Expose the port Next.js runs on
EXPOSE 3000

# Command to run the application in development mode
CMD ["npm", "run", "dev"]
