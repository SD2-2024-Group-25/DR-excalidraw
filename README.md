# Excalidraw Setup Guide

This guide outlines how to set up and run the Excalidraw components, including the storage backend, room server, and Excalidraw itself. 

---

## Running `excalidraw-storage-backend`

1. Navigate to the storage backend directory:
   ```sh
   cd excalidraw-storage-backend/
   ```
2. Install dependencies:
   ```sh
   yarn install
   ```
3. Start the development server:
   ```sh
   yarn start:dev
   ```

### Database Configuration

By default, the database is configured to use SQLite:

```ts
const uri = process.env.STORAGE_URI || 'sqlite://local-db.sqlite';
```

**File:** `storage/storage.service.ts`

#### Changing the Database Location

You can update the database URI in one of the following ways:

- Edit `storage/storage.service.ts` directly.
- Set an environment variable in your shell:
  ```sh
  export STORAGE_URI=sqlite://your-db-file.sqlite
  ```
- Create a `.env` file in the project root with:
  ```sh
  STORAGE_URI=sqlite://local-db.sqlite
  ```

---

## Running `excalidraw-room`

1. Navigate to the room server directory:
   ```sh
   cd excalidraw-room/
   ```
2. Install dependencies:
   ```sh
   yarn install
   ```
3. Start the development server:
   ```sh
   yarn start:dev
   ```

---

## Running `excalidraw`

1. Navigate to the Excalidraw directory:
   ```sh
   cd excalidraw/
   ```
2. Install dependencies:
   ```sh
   yarn install
   ```
3. Start the application:
   ```sh
   yarn start
   ```

### Environment Configuration

Ensure that the `.env.development` and `.env.production` files are correctly configured to point to the appropriate services. By default I set it to run runs on port `5000`.

---

## Integrating with Dungeon Revealer (DR)

### Branch: `feature/iframe-for-excalidraw-links`

1. Run Excalidraw as usual following the steps above.
2. Verify that the iframe integration works as expected.
