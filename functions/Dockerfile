FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the functions
RUN npm run build

# Expose the port the app runs on
EXPOSE 5001

# Command to run the app
CMD ["npm", "run", "serve"]
