FROM node:18

WORKDIR /usr/src/excalidraw-room

COPY . .
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

EXPOSE 3002

# Start the server
CMD ["npm", "run", "start:prod"]
