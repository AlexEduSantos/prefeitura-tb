import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly redis: Redis | null;
  private readonly memoryFallback = new Map<string, MemoryCacheEntry>();

  constructor() {
    const host = process.env.REDIS_HOST;
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    if (process.env.NODE_ENV === 'test' || !host) {
      this.redis = null;
    } else {
      this.redis = new Redis({
        host,
        port,
        password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redis.on('error', () => {
        // Silencia erros de conexão transitórios e delega para o fallback em memória
      });
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        this.redis.disconnect();
      }
    }
  }

  private async ensureRedisConnected(): Promise<boolean> {
    if (!this.redis) return false;
    if (this.redis.status === 'ready') return true;
    if (this.redis.status === 'wait') {
      try {
        await this.redis.connect();
        return (this.redis.status as string) === 'ready';
      } catch {
        return false;
      }
    }
    return false;
  }

  async get<T>(key: string): Promise<T | null> {
    if (await this.ensureRedisConnected()) {
      try {
        const raw = await this.redis!.get(key);
        if (raw !== null) {
          return JSON.parse(raw) as T;
        }
        return null;
      } catch {
        // Fallback para memória abaixo
      }
    }

    const entry = this.memoryFallback.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = 300,
  ): Promise<void> {
    const serialized = JSON.stringify(value);

    if (await this.ensureRedisConnected()) {
      try {
        await this.redis!.set(key, serialized, 'EX', ttlSeconds);
      } catch {
        // Continua para o fallback em memória
      }
    }

    this.memoryFallback.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await factory();
    if (fresh !== undefined && fresh !== null) {
      await this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    for (const key of this.memoryFallback.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryFallback.delete(key);
      }
    }

    if (await this.ensureRedisConnected()) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await this.redis!.scan(
            cursor,
            'MATCH',
            `${prefix}*`,
            'COUNT',
            100,
          );
          cursor = nextCursor;
          if (keys.length > 0) {
            await this.redis!.del(...keys);
          }
        } while (cursor !== '0');
      } catch {
        // Ignora erro de Redis caso indisponível
      }
    }
  }
}
