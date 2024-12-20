# Use the official Node.js image as the base image
FROM node:lts-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# run npm link to link the local package to the global module directory
RUN npm link

# Expose the port the app runs on
EXPOSE 3000

# env variables
ENV MONGO_URI=mongodb://mongo:27017/apartmentData
ENV MQTT_BROKER_URL='mqtts://mqtt.cgobinak.rahtiapp.fi'
ENV TOPIC='vacant/allapartments'
ENV MQTT_PORT=443

# Serve the app
CMD ["npm", "start"]
