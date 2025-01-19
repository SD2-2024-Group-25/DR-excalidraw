# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy the `excalidraw` project into the container
COPY ./excalidraw ./excalidraw

# Navigate to the `excalidraw` directory, install dependencies, and build the app
WORKDIR /app/excalidraw
RUN yarn install && yarn run build

# Expose the dynamic port for Railway
EXPOSE 3000 3001 3002

# Start the `excalidraw` service
CMD ["yarn", "start"]
