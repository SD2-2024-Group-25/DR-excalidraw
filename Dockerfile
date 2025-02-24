FROM node:20-alpine as builder

ARG CHINA_MIRROR=false

# Enable China Alpine Mirror if CHINA_MIRROR is true
RUN if [ "$CHINA_MIRROR" = "true" ]; then \
    echo "Enable China Alpine Mirror" && \
    sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories; \
    fi

# Install required packages
RUN apk add --update python3 make g++ curl pkgconf cairo-dev jpeg-dev pango-dev giflib-dev sqlite
# Optionally configure Yarn registry to use the China mirror
RUN if [ "$CHINA_MIRROR" = "true" ]; then \
    echo "Enable China Yarn Mirror" && \
    yarn config set registry https://registry.npmmirror.com; \
    fi

# Install global packages using yarn
RUN yarn global add eslint @nestjs/cli

WORKDIR /app

# Copy dependency files
COPY package.json .
COPY yarn.lock .

# Install dependencies using yarn
RUN yarn install

# Copy the rest of your application code
COPY . .

# Build your application (assuming "build" script exists in package.json)
RUN yarn build

FROM node:20-alpine

WORKDIR /app

# Copy built assets and dependencies from the builder stage
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules

USER node

EXPOSE 8080

# Use yarn to run the production start command
ENTRYPOINT ["yarn", "run", "start:prod"]

