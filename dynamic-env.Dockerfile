FROM node:18 AS build

WORKDIR /opt/node_app

# Copy necessary files for dependency installation
COPY excalidraw/package.json excalidraw/yarn.lock ./

RUN yarn --ignore-optional --network-timeout 600000

ARG NODE_ENV=production

# Copy the rest of the application code
COPY excalidraw/ .

# Replace `import.meta.env` with `window._env_`
RUN sed -i 's/import.meta.env/window._env_/g' $(grep 'import.meta.env' -R -l --include "*.ts" --include "*.tsx" --exclude-dir node_modules .)

# Build the application
RUN yarn build:app:docker

FROM nginx:1.21-alpine

# Copy built files to the NGINX server directory
COPY --from=build /opt/node_app/build /usr/share/nginx/html

# Copy the launcher script
COPY excalidraw/launcher.py /

HEALTHCHECK CMD wget -q -O /dev/null http://localhost || exit 1

EXPOSE 80

CMD ["python3", "/launcher.py", "/usr/share/nginx/html"]
