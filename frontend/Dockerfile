# Use an official Node image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the Vite default port
EXPOSE 5173

# Command to run the React development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]