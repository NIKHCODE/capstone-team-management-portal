
import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
  redisClient: ReturnType<typeof createClient> | undefined;
};

const redisClient =
  globalForRedis.redisClient ??
  createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisClient = redisClient;
}

export async function getRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}
