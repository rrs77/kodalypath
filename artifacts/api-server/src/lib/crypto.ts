import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { logger } from "./logger";

const PREFIX = "enc:v1:";

function readKey(name: string): Buffer {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `${name} environment variable is required for at-rest encryption. ` +
      `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }
  const buf = Buffer.from(v, "hex");
  if (buf.length !== 32) {
    throw new Error(`${name} must be 32 bytes (64 hex chars); got ${buf.length} bytes`);
  }
  return buf;
}

let _encKey: Buffer | null = null;
let _hmacKey: Buffer | null = null;
function encKey(): Buffer { return (_encKey ??= readKey("ENCRYPTION_KEY")); }
function hmacKey(): Buffer { return (_hmacKey ??= readKey("EMAIL_HMAC_KEY")); }

/** AES-256-GCM encrypt. Empty input returns empty string. Always re-encrypts
 *  user-provided plaintext (callers in migrations should `isEncrypted()`
 *  guard themselves to keep idempotency without relying on prefix collisions
 *  in user data). */
export function encrypt(plain: string | null | undefined): string {
  if (plain == null || plain === "") return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Decrypt ciphertext produced by `encrypt`. Returns plaintext as-is for legacy
 *  unprefixed values (allows transparent rolling migration). */
export function decrypt(stored: string | null | undefined): string {
  if (stored == null || stored === "") return "";
  if (!stored.startsWith(PREFIX)) return stored;
  try {
    const buf = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", encKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch (err) {
    logger.error({ err }, "Decryption failed");
    return "";
  }
}

export function isEncrypted(s: string | null | undefined): boolean {
  return !!s && s.startsWith(PREFIX);
}

/** Deterministic HMAC-SHA256 of email — used for unique lookup of an
 *  encrypted email column. Lower-cased + trimmed. */
export function emailHash(email: string): string {
  return createHmac("sha256", hmacKey())
    .update(email.trim().toLowerCase())
    .digest("hex");
}
