import sodium from 'libsodium-wrappers';
import winston from 'winston';

let logEncryptionKey: Buffer;
(async () => {
  await sodium.ready;
  logEncryptionKey = Buffer.from(process.env.LOG_ENCRYPTION_KEY || sodium.randombytes_buf(32).toString('hex'), 'hex');
})();

function encryptLog(data: string): string {
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(Buffer.from(data), nonce, logEncryptionKey);
  return `${Buffer.from(nonce).toString('hex')}:${Buffer.from(ciphertext).toString('hex')}`;
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format((info) => {
      info.message = encryptLog(JSON.stringify(info));
      return info;
    })()
  ),
  transports: [
    new winston.transports.File({ filename: 'security-audit.log' }),
    new winston.transports.Console()
  ]
});

export { encryptLog, logger };
