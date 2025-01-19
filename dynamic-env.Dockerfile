FROM node:18 AS build

WORKDIR /opt/node_app

COPY package.json yarn.lock ./
RUN yarn --ignore-optional --network-timeout 600000

ARG NODE_ENV=production

COPY . .
RUN sed -i 's/import.meta.env/window._env_/g' $(grep 'import.meta.env' -R -l --include "*.ts" --include "*.tsx" --exclude-dir node_modules .)
RUN yarn build:app:docker

FROM nginx:1.21-alpine

ENV VITE_APP_BACKEND_V2_GET_URL=https://json.excalidraw.com/api/v2/
ENV VITE_APP_BACKEND_V2_POST_URL=https://json.excalidraw.com/api/v2/post/

COPY --from=build /opt/node_app/build /usr/share/nginx/html
COPY launcher.py /

EXPOSE 80

CMD ["python3", "/launcher.py", "/usr/share/nginx/html"]
