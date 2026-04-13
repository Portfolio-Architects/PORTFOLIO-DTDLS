import { Redis } from "@upstash/redis";

/**
 * Shared Upstash Redis instance
 * Initializes only if environment variables exist, allowing fail-open behavior.
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
