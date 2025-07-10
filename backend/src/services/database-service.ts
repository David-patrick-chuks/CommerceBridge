import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';

export class DatabaseService {
  private mongoConnection: typeof mongoose | null = null;
  private redisClient: RedisClientType | null = null;

  async connect(): Promise<void> {
    try {
      // Connect to MongoDB
      await this.connectMongoDB();
      // Connect to Redis
      await this.connectRedis();
      console.log('✅ All database connections established');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private async connectMongoDB(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }
      this.mongoConnection = await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  private async connectRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });
      this.redisClient.on('error', (err) => {
        console.error('❌ Redis error:', err);
      });
      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected');
      });
      await this.redisClient.connect();
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Close MongoDB connection
      if (this.mongoConnection) {
        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected');
      }
      // Close Redis connection
      if (this.redisClient) {
        await this.redisClient.quit();
        console.log('✅ Redis disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting databases:', error);
    }
  }

  // MongoDB methods
  getMongoConnection(): typeof mongoose {
    if (!this.mongoConnection) {
      throw new Error('MongoDB not connected');
    }
    return this.mongoConnection;
  }

  // Redis methods
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    if (ttl) {
      await this.redisClient.setEx(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    return await this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  // Health check
  async healthCheck(): Promise<{
    mongodb: boolean;
    redis: boolean;
  }> {
    const health = {
      mongodb: false,
      redis: false
    };
    try {
      // Check MongoDB
      if (this.mongoConnection && mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        health.mongodb = true;
      }
    } catch (error) {
      console.error('MongoDB health check failed:', error);
    }
    try {
      // Check Redis
      if (this.redisClient) {
        await this.redisClient.ping();
        health.redis = true;
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
    return health;
  }

  // Get connection status
  getConnectionStatus(): {
    mongodb: boolean;
    redis: boolean;
  } {
    return {
      mongodb: this.mongoConnection !== null,
      redis: this.redisClient !== null
    };
  }
} 