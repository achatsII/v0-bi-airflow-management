export function base64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function sha256(s: string) {
  const enc = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return base64url(hash);
}

export function randomString(len = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const arr = crypto.getRandomValues(new Uint8Array(len));
  for (const n of arr) out += chars[n % chars.length];
  return out;
}
