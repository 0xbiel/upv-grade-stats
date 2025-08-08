// Lightweight AES-GCM crypto utilities for browser usage
// Provides base64url encoding helpers and encrypt/decrypt using a random key

// Base64url helpers
export function toBase64Url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function fromBase64Url(b64url: string): Uint8Array {
  const pad = (4 - (b64url.length % 4)) % 4;
  const b64 = (b64url + "===".slice(0, pad)).replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface EncryptedPayload {
  // base64url(iv) + ":" + base64url(ciphertext)
  payload: string;
  // hex-encoded 128-bit key
  keyHex: string;
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(view.byteLength);
  const out = new Uint8Array(ab);
  out.set(view);
  return ab;
}

// Encrypts bytes using a random 128-bit AES-GCM key and random 96-bit IV
export async function encryptBytes(bytes: Uint8Array): Promise<EncryptedPayload> {
  const rawKey = crypto.getRandomValues(new Uint8Array(16)); // 128-bit
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(rawKey),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit recommended
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(bytes));
  return {
    payload: `${toBase64Url(iv)}:${toBase64Url(ct)}`,
    keyHex: toHex(rawKey),
  };
}

export async function decryptToBytes(payload: string, keyHex: string): Promise<Uint8Array> {
  const [ivB64, ctB64] = payload.split(":");
  if (!ivB64 || !ctB64) throw new Error("Invalid payload format");
  const rawKey = fromHex(keyHex);
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(rawKey),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const iv = fromBase64Url(ivB64);
  const ct = fromBase64Url(ctB64);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(ct));
  return new Uint8Array(pt);
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}
