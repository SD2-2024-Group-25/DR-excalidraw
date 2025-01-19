FROM node:18 AS build

WORKDIR /opt/node_app

# Copy dependency files
COPY excalidraw/package.json excalidraw/yarn.lock ./
RUN yarn install --ignore-optional --network-timeout 600000

# Copy the application source code
COPY excalidraw/ .

# Install Rollup native dependency
RUN yarn add -D @rollup/rollup-linux-x64-gnu

# Replace import.meta.env with window._env_
RUN sed -i 's/import.meta.env/window._env_/g' $(grep 'import.meta.env' -R -l --include "*.ts" --include "*.tsx" --exclude-dir node_modules .)

# Build the application
RUN yarn build:app:docker

FROM nginx:1.21-alpine

# Copy build output
COPY --from=build /opt/node_app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
