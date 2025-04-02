import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export enum StorageNamespace {
  SCENES = 'SCENES',
  //ROOMS = 'ROOMS',
  //FILES = 'FILES',
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  //private readonly baseDir = path.join(__dirname, '../../uploads'); // Base directory for storage
  private readonly baseDir = path.join(
    '/usr/src/dungeon-revealer/public/research/whiteboard',
  );
  constructor() {
    Object.values(StorageNamespace).forEach((namespace) => {
      const dirPath = path.join(this.baseDir, namespace);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // Ensure directory exists
        this.logger.log(`Created storage directory: ${dirPath}`);
      }
    });
  }

  /**
   * Save a file to the storage directory
   */
  async saveFile(
    namespace: StorageNamespace,
    filename: string,
    data: Buffer,
  ): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, namespace, filename);
      fs.writeFileSync(filePath, data);
      this.logger.log(`File saved: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to save file "${filename}": ${error.message}`);
      return false;
    }
  }

  /**
   * Retrieve a file from storage
   */
  async getFile(
    namespace: StorageNamespace,
    filename: string,
  ): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.baseDir, namespace, filename);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return fs.readFileSync(filePath);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve file "${filename}": ${error.message}`,
      );
      return null;
    }
  }

  /**
   * List all files in a namespace
   */
  async listFiles(namespace: StorageNamespace): Promise<string[]> {
    try {
      const dirPath = path.join(this.baseDir, namespace);
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      return fs.readdirSync(dirPath).filter((file) => file.endsWith('.png')); // Only return image files
    } catch (error) {
      this.logger.error(
        `Failed to list files in namespace "${namespace}": ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(
    namespace: StorageNamespace,
    filename: string,
  ): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, namespace, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to delete file "${filename}": ${error.message}`,
      );
      return false;
    }
  }
}
