import { Redis } from '@upstash/redis';

// Use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from .env
// We handle the case where the user hasn't set them yet by falling back to in-memory mode if disabled or not provided.
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = isRedisConfigured 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;
