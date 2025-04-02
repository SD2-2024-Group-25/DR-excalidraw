FROM node:18

WORKDIR /usr/src/excalidraw-room

# Copy dependencies first for better caching
COPY package.json yarn.lock ./
RUN yarn install

# Copy the rest of the application files
COPY . .

# Build the application
RUN yarn build

EXPOSE 3002

# Start the server
CMD ["yarn", "start"]
