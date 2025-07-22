/**
 * Optional: Redis Cache Service for Chat Performance
 * Install redis with: npm install redis @types/redis
 * This improves performance by caching frequently accessed data
 */

import Redis from 'redis';

interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expireIn?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

class ChatCacheService implements CacheService {
  private client: Redis.RedisClientType | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      // Only use Redis if REDIS_URL is provided
      if (process.env.REDIS_URL) {
        this.client = Redis.createClient({
          url: process.env.REDIS_URL,
        });

        this.client.on('error', (err) => {
          console.log('Redis Client Error', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('Redis Client Connected');
          this.isConnected = true;
        });

        await this.client.connect();
      } else {
        console.log('Redis not configured, using in-memory cache fallback');
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, expireIn = 3600): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.setEx(key, expireIn, value);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // Chat-specific cache methods
  async cacheConversation(conversationId: string, conversation: any): Promise<void> {
    const key = `conversation:${conversationId}`;
    await this.set(key, JSON.stringify(conversation), 1800); // 30 minutes
  }

  async getCachedConversation(conversationId: string): Promise<any | null> {
    const key = `conversation:${conversationId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheUserConversations(userId: string, conversations: any[]): Promise<void> {
    const key = `user:${userId}:conversations`;
    await this.set(key, JSON.stringify(conversations), 600); // 10 minutes
  }

  async getCachedUserConversations(userId: string): Promise<any[] | null> {
    const key = `user:${userId}:conversations`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.del(`user:${userId}:conversations`);
  }

  async invalidateConversationCache(conversationId: string): Promise<void> {
    await this.del(`conversation:${conversationId}`);
  }

  // Online users cache
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    const key = `online:${userId}`;
    await this.set(key, socketId, 300); // 5 minutes
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.del(`online:${userId}`);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return await this.exists(`online:${userId}`);
  }
}

// In-memory fallback cache
class InMemoryCacheService implements CacheService {
  private cache = new Map<string, { value: string; expiry: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, expireIn = 3600): Promise<void> {
    const expiry = Date.now() + (expireIn * 1000);
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Export singleton instance
const cacheService = process.env.REDIS_URL 
  ? new ChatCacheService() 
  : new InMemoryCacheService();

export { cacheService };
