import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

export async function hashFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export async function checkFileIntegrity(filePath: string): Promise<boolean> {
  const currentHash = await hashFile(filePath);
  const storedHash = await redisClient.get(`integrity:${filePath}`);
  return !storedHash || storedHash === currentHash;
}

export async function updateFileHash(filePath: string): Promise<void> {
  const hash = await hashFile(filePath);
  await redisClient.set(`integrity:${filePath}`, hash);
} 