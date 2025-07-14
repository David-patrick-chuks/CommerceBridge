import sodium from 'libsodium-wrappers';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

const KEY_HISTORY_KEY = 'keymanager:history';
const CURRENT_KEY_KEY = 'keymanager:current';

export async function generateKey(): Promise<string> {
  await sodium.ready;
  return Buffer.from(sodium.randombytes_buf(32)).toString('hex');
}

export async function rotateKey(): Promise<string> {
  const newKey = await generateKey();
  const timestamp = new Date().toISOString();
  // Store previous key in history
  const prevKey = await redisClient.get(CURRENT_KEY_KEY);
  if (prevKey) {
    await redisClient.lPush(KEY_HISTORY_KEY, JSON.stringify({ key: prevKey, timestamp }));
  }
  await redisClient.set(CURRENT_KEY_KEY, newKey);
  return newKey;
}

export async function getCurrentKey(): Promise<string | null> {
  return await redisClient.get(CURRENT_KEY_KEY);
}

export async function getKeyHistory(limit = 10): Promise<Array<{ key: string; timestamp: string }>> {
  const items = await redisClient.lRange(KEY_HISTORY_KEY, 0, limit - 1);
  return items.map(item => JSON.parse(item));
} 