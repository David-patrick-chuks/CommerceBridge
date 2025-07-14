import { createCipheriv, createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

const dbEncryptionKey = Buffer.from(process.env.DB_ENCRYPTION_KEY || randomBytes(32).toString('hex'), 'hex');

export async function backupDatabase(data: any, backupPath: string): Promise<void> {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', dbEncryptionKey, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const backup = { iv: iv.toString('hex'), encrypted };
  await fs.writeFile(backupPath, JSON.stringify(backup));
  const hash = createHash('sha256').update(JSON.stringify(backup)).digest('hex');
  await redisClient.set(`backup:hash:${backupPath}`, hash);
}

export async function verifyBackupIntegrity(backupPath: string): Promise<boolean> {
  const content = await fs.readFile(backupPath);
  const hash = createHash('sha256').update(content).digest('hex');
  const storedHash = await redisClient.get(`backup:hash:${backupPath}`);
  return storedHash === hash;
} 