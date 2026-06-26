import type { TursoExportRecord } from "../faced-export-shared";
import { formatDisplayBirthdate } from "../faced-types";
import type { FacedIdCardData } from "./faced-id-print-types";
import { buildOfflineDmsPrintBundle } from "./offlineDmsFacedPrint";
import { openFacedIdPrintWindow } from "./facedIdPrintWindow";

function displaySex(sex: string): string {
  const normalized = sex.trim().toUpperCase();
  if (normalized === "M" || normalized === "MALE") return "MALE";
  if (normalized === "F" || normalized === "FEMALE") return "FEMALE";
  return sex.trim().toUpperCase();
}

export function buildFacedIdCard(record: TursoExportRecord): FacedIdCardData {
  const { head } = buildOfflineDmsPrintBundle(record);
  const hof = record.head_of_family;
  const fullName = [hof.first_name, hof.middle_name, hof.last_name, hof.name_extension]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  return {
    serial_code: head.serial_code,
    full_name: fullName,
    birthdate: head.concatenated_bdate || formatDisplayBirthdate(hof.birthdate),
    age: head.age_display,
    sex: displaySex(head.sex),
    barangay: head.location_barangay || record.barangay || "",
    city_mun: head.city_mun || record.city_municipality || "",
    province: head.province || record.province || "",
    uuid: record.uuid,
  };
}

export function openFacedIdPrint(cards: FacedIdCardData[], label?: string): boolean {
  if (!cards.length) return false;

  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const title =
    label ??
    (cards.length === 1
      ? `FACED ID — ${cards[0].serial_code} — ${dateLabel}`
      : `FACED ID — ${cards.length} beneficiaries — ${dateLabel}`);

  return openFacedIdPrintWindow({ cards, title }) !== null;
}

export function openFacedIdPrintForRecord(record: TursoExportRecord, label?: string): boolean {
  const card = buildFacedIdCard(record);
  return openFacedIdPrint([card], label ?? `FACED ID — ${card.full_name}`);
}
