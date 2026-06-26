export const SARANGANI_REGION = "XII";
export const SARANGANI_PROVINCE = "SARANGANI";

export const SARANGANI_MUNICIPALITIES = [
  "Alabel",
  "Glan",
  "Kiamba",
  "Maasim",
  "Maitum",
  "Malapatan",
  "Malungon",
] as const;

export type SaranganiMunicipality = (typeof SARANGANI_MUNICIPALITIES)[number];

/** Barangays per municipality (PSGC / LGU lists) */
export const SARANGANI_BARANGAYS: Record<SaranganiMunicipality, readonly string[]> = {
  Alabel: [
    "Alegria",
    "Bagacay",
    "Baluntay",
    "Datal Anggas",
    "Domolok",
    "Kawas",
    "Ladol",
    "Maribulan",
    "New Canaan",
    "Pag-Asa",
    "Paraiso",
    "Poblacion",
    "Spring",
    "Tokawal",
  ],
  Glan: [
    "Baliton",
    "Batotuling",
    "Batulaki",
    "Big Margus",
    "Burias",
    "Cablalan",
    "Calabanit",
    "Calpidong",
    "Congan",
    "Cross",
    "Datalbukay",
    "E. Alegado",
    "Glan Padidu",
    "Gumasa",
    "Kapatan",
    "Lago",
    "Laguimit",
    "Mudan",
    "New Aklan",
    "Pangyan",
    "Poblacion",
    "Rio del Pilar",
    "San Jose",
    "San Vicente",
    "Small Margus",
    "Sufatubo",
    "Taluya",
    "Tango",
    "Tapon",
    "Timbangan",
    "Uyandieng",
  ],
  Kiamba: [
    "Badtasan",
    "Datu Dani",
    "Gasi",
    "Kapate",
    "Katubao",
    "Kayupo",
    "Lagundi",
    "Lebe",
    "Ling (Lumit)",
    "Lomuyon",
    "Luma",
    "Maligang",
    "Nalus",
    "Poblacion",
    "Salakit",
    "Suli",
    "Tablao",
    "Tamadang",
    "Tambilil",
  ],
  Maasim: [
    "Amsipit",
    "Bales",
    "Colon",
    "Daliao",
    "Kabatiol",
    "Kablacan",
    "Kamanga",
    "Kanalo",
    "Lumasal",
    "Lumatil",
    "Malbang",
    "Nomoh",
    "Pananag",
    "Poblacion",
    "Seven Hills",
    "Tinoto",
  ],
  Maitum: [
    "Bati-an",
    "Kalaneg",
    "Kalaong",
    "Kiambing",
    "Kiayap",
    "Mabay",
    "Maguling",
    "Malag (Pob.)",
    "Mindupok",
    "New La Union",
    "Old Poblacion",
    "Pangi (Linao)",
    "Pinol",
    "Sison (Edenton)",
    "Ticulab",
    "Tuanadatu",
    "Upo (Lanao)",
    "Wali (Kambuhan)",
    "Zion",
  ],
  Malapatan: [
    "Daan Suyan",
    "Kihan",
    "Kinam",
    "Libi",
    "Lun Masla",
    "Lun Padidu",
    "Patag",
    "Poblacion",
    "Sapu Masla",
    "Sapu Padidu",
    "Tuyan",
    "Upper Suyan",
  ],
  Malungon: [
    "Alkikan",
    "Ampon",
    "Atlae",
    "Banahaw",
    "Banate",
    "Blaan",
    "Datal Batong",
    "Datal Bila",
    "Datal Tampal",
    "J.P. Laurel",
    "Kawayan",
    "Kibala",
    "Kiblat",
    "Kinabalan",
    "Lower Mainit",
    "Lutay",
    "Malabod",
    "Malalag Cogon",
    "Malandag",
    "Malungon Gamay",
    "Nagpan",
    "Panamin",
    "Poblacion",
    "San Juan",
    "San Miguel",
    "San Roque",
    "Talus",
    "Tamban",
    "Upper Biangan",
    "Upper Lumabat",
    "Upper Mainit",
  ],
};

export const GLAN_EVACUATION_SITE_SUGGESTIONS = [
  "Big Margus Gym",
  "Tonga Lim Siao Jr. Integrated School Evacuation Site",
  "Miasong Integrated School",
  "Pangyan Plaza Evacuation Center",
  "Purok Lapuville Evacuation Center",
  "Glan Municipal Plaza (Tent City)",
  "Glan Central Integrated School",
  "Severino Ibon Sr. Elementary School",
] as const;

export const MALAPATAN_EVACUATION_SITE_SUGGESTIONS = [
  "Poblacion Municipal Gym",
  "Purok 4&5 Poblacion",
  "Akbungkod",
  "Libi Integrated School",
  "Calay IP School",
  "Mamanawa Elementary School",
  "Barangay Covered Court",
  "Datu Pangolima Integrated School",
  "Gufaya",
  "Malapatan Central Elem. School",
] as const;

export function evacuationSiteSuggestions(cityMunicipality: string): readonly string[] {
  const municipality = cityMunicipality.trim().toLowerCase();
  if (municipality === "glan") {
    return GLAN_EVACUATION_SITE_SUGGESTIONS;
  }
  if (municipality === "malapatan") {
    return MALAPATAN_EVACUATION_SITE_SUGGESTIONS;
  }
  return [];
}

export function municipalityOptions() {
  return SARANGANI_MUNICIPALITIES.map((m) => ({ value: m, label: m }));
}

export function barangayOptions(municipality: string) {
  const list =
    SARANGANI_BARANGAYS[municipality as SaranganiMunicipality] ?? [];
  return list.map((b) => ({ value: b, label: b }));
}

const BARANGAY_CANONICAL = new Map<string, string>();
for (const list of Object.values(SARANGANI_BARANGAYS)) {
  for (const name of list) {
    BARANGAY_CANONICAL.set(name.toUpperCase(), name);
  }
}

function toProperCaseWords(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-/])(\w)/g, (_, separator, char) => `${separator}${char.toUpperCase()}`);
}

/** Display barangay names in canonical/proper case (e.g. TUYAN → Tuyan). */
export function formatDisplayBarangay(
  barangay: string,
  cityMunicipality?: string,
): string {
  const trimmed = barangay.trim();
  if (!trimmed) return trimmed;

  const canonical = BARANGAY_CANONICAL.get(trimmed.toUpperCase());
  if (canonical) return canonical;

  const municipality = cityMunicipality?.trim();
  if (municipality && isSaranganiMunicipality(municipality)) {
    const match = SARANGANI_BARANGAYS[municipality].find(
      (name) => name.toUpperCase() === trimmed.toUpperCase(),
    );
    if (match) return match;
  }

  return toProperCaseWords(trimmed);
}

export function isSaranganiMunicipality(
  value: string,
): value is SaranganiMunicipality {
  return (SARANGANI_MUNICIPALITIES as readonly string[]).includes(value);
}

export function birthplaceSuggestion(
  barangay: string,
  cityMunicipality: string,
  province = SARANGANI_PROVINCE,
): string | null {
  const barangayName = barangay.trim();
  const municipality = cityMunicipality.trim();
  if (!barangayName || !municipality) return null;
  return `${barangayName}, ${municipality}, ${province.trim() || SARANGANI_PROVINCE}`;
}
