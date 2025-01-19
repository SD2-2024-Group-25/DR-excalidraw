# Base image
FROM node:16

# Set working directory
WORKDIR /app

# Copy the entire project into the container
COPY . .

# Build each service
RUN cd excalidraw && yarn install && yarn run build
RUN cd excalidraw-room && yarn install && yarn run build
RUN cd excalidraw-storage-backend && npm install && npm run prebuild && npm run build

# Install concurrently globally to run all services together
RUN npm install -g concurrently

# Expose the ports used by the services (adjust as needed)
EXPOSE 3000 3001 3002

# Start all services in parallel
CMD concurrently \
  "cd excalidraw && yarn start" \
  "cd excalidraw-room && yarn start" \
  "cd excalidraw-storage-backend && npm start"
