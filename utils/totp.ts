// TOTP (RFC 6238) - implementacao leve para 2FA do perfil dev (SHA-1 puro, sem Web Crypto)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input) {
  const clean = input.replace(/=+$/, '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((clean.length * 5) / 8));
  for (let i = 0; i < clean.length; i++) {
    const c = BASE32_ALPHABET.indexOf(clean[i]);
    if (c < 0) continue;
    value = (value << 5) | c;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output;
}

function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function generateTotpSecret(length = 20) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return base32Encode(bytes);
}

function sha1(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const bitLen = data.length * 8;
  const padLen = (55 - (data.length % 64) + 64) % 64;
  const totalLen = data.length + 1 + padLen + 8;
  const padded = new Uint8Array(totalLen);
  padded.set(data);
  padded[data.length] = 0x80;
  let l = bitLen;
  for (let i = 0; i < 8; i++) {
    padded[totalLen - 8 + (7 - i)] = l & 0xff;
    l = Math.floor(l / 256);
  }
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const w = new Array(80);
  for (let off = 0; off < totalLen; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      w[i] = (((padded[j] << 24) >>> 0) + (padded[j + 1] << 16) + (padded[j + 2] << 8) + padded[j + 3]) >>> 0;
    }
    for (let i = 16; i < 80; i++) {
      const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = ((x << 1) | (x >>> 31)) >>> 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) { f = (b & c) | ((~b) & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const rotl = ((a << 5) | (a >>> 27)) >>> 0;
      const temp = (rotl + (f >>> 0) + (e >>> 0) + (k >>> 0) + (w[i] >>> 0)) >>> 0;
      e = d >>> 0;
      d = c >>> 0;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a >>> 0;
      a = temp;
    }
    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
  }
  const out = new Uint8Array(20);
  for (let i = 0; i < 5; i++) {
    out[i * 4] = (h[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (h[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (h[i] >>> 8) & 0xff;
    out[i * 4 + 3] = h[i] & 0xff;
  }
  return out;
}

function hmacSha1(key, message) {
  const blockSize = 64;
  let k = key;
  if (k.length > blockSize) k = sha1(k);
  if (k.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(k);
    k = padded;
  }
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = k[i] ^ 0x36;
    opad[i] = k[i] ^ 0x5c;
  }
  const inner = new Uint8Array(blockSize + message.length);
  inner.set(ipad);
  inner.set(message, blockSize);
  const innerHash = sha1(inner);
  const outer = new Uint8Array(blockSize + 20);
  outer.set(opad);
  outer.set(innerHash, blockSize);
  return sha1(outer);
}

function intToBytes(num) {
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return bytes;
}

export async function generateTotp(secret, window = 0) {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30) + window;
  const msg = intToBytes(counter);
  const hash = hmacSha1(key, msg);
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

export async function verifyTotp(secret, code) {
  const clean = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  for (const w of [-1, 0, 1]) {
    const expected = await generateTotp(secret, w);
    if (expected === clean) return true;
  }
  return false;
}

export function totpOtpAuthUrl(secret, account = 'dev@versiory', issuer = 'Versiory') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}