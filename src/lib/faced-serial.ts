import { generateFacedSerialNumber } from "./code-generator";

export function legacyFacedSerialFromUuid(uuid: string): string {
  const compact = uuid.replace(/-/g, "").toUpperCase();
  return `FACED-SN-${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

/** Serial shown on FACED forms — never the encoder access code. */
export function resolveFacedSerialNumber(record: {
  serial_number?: string;
  uuid: string;
}): string {
  const serial = record.serial_number?.trim();
  if (serial) return serial;
  return legacyFacedSerialFromUuid(record.uuid);
}

export function ensureFacedSerialNumber(
  serial_number: string | undefined,
  uuid?: string,
): string {
  const trimmed = serial_number?.trim();
  if (trimmed) return trimmed;
  if (uuid?.trim()) return legacyFacedSerialFromUuid(uuid);
  return generateFacedSerialNumber();
}
