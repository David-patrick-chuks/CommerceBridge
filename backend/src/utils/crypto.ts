import sodium from 'libsodium-wrappers';

export async function encryptData(data: string, key: Buffer): Promise<{ nonce: string; ciphertext: string }> {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(Buffer.from(data), nonce, key);
  return {
    nonce: Buffer.from(nonce).toString('hex'),
    ciphertext: Buffer.from(ciphertext).toString('hex')
  };
}

export async function decryptData(ciphertextHex: string, nonceHex: string, key: Buffer): Promise<string> {
  await sodium.ready;
  const nonce = Buffer.from(nonceHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  return Buffer.from(decrypted).toString('utf8');
} 