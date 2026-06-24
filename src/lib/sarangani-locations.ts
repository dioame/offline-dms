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

export function municipalityOptions() {
  return SARANGANI_MUNICIPALITIES.map((m) => ({ value: m, label: m }));
}

export function barangayOptions(municipality: string) {
  const list =
    SARANGANI_BARANGAYS[municipality as SaranganiMunicipality] ?? [];
  return list.map((b) => ({ value: b, label: b }));
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
