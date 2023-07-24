# Use an official Node.js runtime as a parent image
FROM node:12

# Set the working directory in the container to /app
WORKDIR /app

# Copy the package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies in the container
RUN npm install

# Copy all application files to the container
COPY . .

# Expose port 8000 to the host machine
EXPOSE 8000

# Run the application when the container starts
CMD ["npm", "start"]