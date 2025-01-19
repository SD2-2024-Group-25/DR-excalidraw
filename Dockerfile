# Stage 1: Build
FROM node:18 AS build

# Set the working directory
WORKDIR /opt/node_app

# Copy the dependency files from the `excalidraw` subdirectory
COPY excalidraw/package.json excalidraw/yarn.lock ./
RUN yarn install --production --ignore-optional --network-timeout 600000

# Copy the entire `excalidraw` folder
COPY excalidraw ./excalidraw

# Set the working directory to the `excalidraw-app` subfolder
WORKDIR /opt/node_app/excalidraw/excalidraw-app
RUN yarn build:app:docker

# Stage 2: Serve with Nginx
FROM nginx:1.21-alpine

# Copy built files from the build stage
COPY --from=build /opt/node_app/excalidraw/excalidraw-app/build /usr/share/nginx/html

# Healthcheck to verify the service
HEALTHCHECK CMD wget -q -O /dev/null http://localhost || exit 1

# Expose port 80
EXPOSE 80

# Use the default Nginx command
CMD ["nginx", "-g", "daemon off;"]
