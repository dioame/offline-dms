const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let result = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i]! % CHARSET.length];
  }
  return result;
}

export function generateAccessCode(): string {
  return `FACED-${randomSegment(4)}-${randomSegment(4)}`;
}

export function normalizeAccessCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
