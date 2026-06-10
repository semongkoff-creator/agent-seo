import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getSecretKey(): Buffer {
  const encodedKey = process.env.TOKEN_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
  if (!encodedKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY is required');
  }

  const raw = Buffer.from(encodedKey, 'base64');
  if (raw.length === 32) {
    return raw;
  }

  return scryptSync(encodedKey, 'seo-agent-secrets', 32);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ['v1', iv.toString('base64'), encrypted.toString('base64'), tag.toString('base64')].join('.');
}

export function decryptSecret(ciphertext: string): string {
  const [version, ivB64, bodyB64, tagB64] = ciphertext.split('.');
  if (version !== 'v1' || !ivB64 || !bodyB64 || !tagB64) {
    throw new Error('Invalid secret payload');
  }

  const decipher = createDecipheriv(ALGORITHM, getSecretKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(bodyB64, 'base64')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}
