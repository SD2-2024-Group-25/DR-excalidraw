
import { Injectable, Logger } from '@nestjs/common';
import Keyv from 'keyv';
import KeyvSqlite from '@keyv/sqlite';

export enum StorageNamespace {
  DEFAULT = 'DEFAULT',
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storagesMap = new Map<StorageNamespace, Keyv>();

constructor() {
  const uri = process.env.STORAGE_URI || 'sqlite://local-db.sqlite';

  Object.values(StorageNamespace).forEach((namespace) => {
    const keyv = new Keyv({
      store: new KeyvSqlite(uri), // Pass only the URI here
      namespace: namespace,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });

    keyv.on('error', (err) => {
      this.logger.error(`Storage error (${namespace}):`, err);
    });

    this.storagesMap.set(namespace, keyv);
  });
}

  async set(key: string, value: any, namespace: StorageNamespace = StorageNamespace.DEFAULT): Promise<boolean> {
    try {
      const keyv = this.storagesMap.get(namespace);

      if (!keyv) {
        throw new Error(`Namespace ${namespace} not found`);
      }

      await keyv.set(key, value);
      this.logger.log(`Successfully set key "${key}" in namespace "${namespace}"`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set key "${key}":`, error);
      return false;
    }
  }

  async get(key: string, namespace: StorageNamespace = StorageNamespace.DEFAULT): Promise<any | null> {
    try {
      const keyv = this.storagesMap.get(namespace);

      if (!keyv) {
        throw new Error(`Namespace ${namespace} not found`);
      }

      const value = await keyv.get(key);
      this.logger.log(`Successfully retrieved key "${key}" from namespace "${namespace}"`);
      return value;
    } catch (error) {
      this.logger.error(`Failed to get key "${key}":`, error);
      return null;
    }
  }

  async getKeys(namespace: StorageNamespace): Promise<string[]> {
    const keyv = this.storagesMap.get(namespace);
    if (!keyv) return [];

    const keys: string[] = [];
    // Keyv’s iterator yields [key, value]. We can pass "*" to get everything in the namespace.
    for await (const [key] of keyv.iterator('*')) {
      keys.push(key);
    }
    return keys;
  }
}
export enum StorageNamespace {
  SCENES = 'SCENES',
  ROOMS = 'ROOMS',
  FILES = 'FILES',
}
