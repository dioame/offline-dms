import type { FacedRecordData, FamilyMember, HeadOfFamily } from "./faced-types";
import {
  FACED_EXPORT_SELECT,
  facedRecordsWhere,
  parseTursoFacedRecordRow,
  type TursoExportRecord,
} from "./faced-export-shared";
import type {
  AgeRow,
  BarangayRow,
  InfoBoardGroup,
  InsideEcGroup,
  MunicipalityOption,
  ReportsBundle,
  SectoralRow,
  ShelterPayload,
} from "./dashboard-types";
import { SARANGANI_MUNICIPALITIES, SARANGANI_PROVINCE, SARANGANI_REGION, formatDisplayBarangay } from "./sarangani-locations";
import {
  isRecordInsideEc,
  evacuationSiteLabel,
  OUTSIDE_EC_LABEL,
} from "./evacuation-site";
import { ensureTursoSchema, getTursoClient } from "./turso";

export const AGE_GROUPS = [
  "INFANT",
  "TODDLER",
  "PRE-SCHOOLER",
  "SCHOOL AGE",
  "TEENAGE",
  "ADULT",
  "ELDERLY",
] as const;

export const AGE_GROUP_LABELS: Record<string, string> = {
  INFANT: "0-6 months old",
  TODDLER: "7 months-2 years old",
  "PRE-SCHOOLER": "3-5 years old",
  "SCHOOL AGE": "6-12 years old",
  TEENAGE: "13-17 years old",
  ADULT: "18-59 years old",
  ELDERLY: "60 years old and above",
};

const SECTORAL_LABELS = [
  ["pregnant", "Pregnant Women"],
  ["lactating", "Lactating Mothers"],
  ["child_headed", "Child-Headed Family"],
  ["single_headed", "Single-Headed Family"],
  ["solo_parent", "Solo Parent"],
  ["pwd", "Persons with Disabilities (PWDs)"],
  ["indigenous", "Indigenous Person"],
  ["four_ps", "4Ps Beneficiaries (4Ps)"],
] as const;

type PersonRow = {
  sex: "M" | "F" | "";
  ageGroup: string;
  inEc: boolean;
  sectoral: Record<(typeof SECTORAL_LABELS)[number][0], boolean>;
};

function normMunicipality(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSex(value: string, male?: boolean, female?: boolean): "M" | "F" | "" {
  const v = value.trim().toUpperCase();
  if (v === "M" || v === "MALE") return "M";
  if (v === "F" || v === "FEMALE") return "F";
  if (female) return "F";
  if (male) return "M";
  return "";
}

function parseAgeYears(age: string): number | null {
  const trimmed = age.trim();
  if (!trimmed) return null;
  const mos = trimmed.match(/^(\d+)\s*MOS/i);
  if (mos) return 0;
  const yo = trimmed.match(/^(\d+)\s*Y\/O/i);
  if (yo) return Number.parseInt(yo[1], 10);
  const n = Number.parseInt(trimmed, 10);
  return Number.isNaN(n) ? null : n;
}

export function computeAgeGroup(ageDisplay: string, years?: number | null): string {
  const display = ageDisplay.trim();
  if (display.toUpperCase().includes("MOS")) {
    const months = Number.parseInt(display.split(/\s+/)[0] ?? "", 10);
    if (!Number.isNaN(months) && months <= 6) return "INFANT";
    return "TODDLER";
  }
  const ageYears = years ?? parseAgeYears(display);
  if (ageYears == null) return "";
  if (ageYears <= 2) return "TODDLER";
  if (ageYears <= 5) return "PRE-SCHOOLER";
  if (ageYears <= 12) return "SCHOOL AGE";
  if (ageYears <= 17) return "TEENAGE";
  if (ageYears <= 59) return "ADULT";
  return "ELDERLY";
}

function textHas(text: string, ...needles: string[]): boolean {
  const upper = text.toUpperCase();
  return needles.some((n) => upper.includes(n));
}

function sectoralFromPerson(
  head: HeadOfFamily,
  member: FamilyMember | null,
  record: FacedRecordData,
  isHead: boolean,
): PersonRow["sectoral"] {
  const vuln = (member?.type_of_vulnerability ?? "").trim();
  const ageYears = parseAgeYears(isHead ? head.age : member?.age ?? "");
  const civil = (head.civil_status ?? "").toUpperCase();

  return {
    pregnant: textHas(vuln, "PREGNANT"),
    lactating: textHas(vuln, "LACTAT"),
    child_headed: isHead && ageYears != null && ageYears < 18,
    single_headed: textHas(vuln, "SINGLE-HEADED", "SINGLE HEADED") || civil.includes("SINGLE"),
    solo_parent: textHas(vuln, "SOLO"),
    pwd: textHas(vuln, "PWD", "DISABIL"),
    indigenous:
      Boolean(record.others?.ip_type_of_ethnicity?.trim()) ||
      textHas(vuln, "IP", "INDIGEN"),
    four_ps: Boolean(record.others?.["4ps_beneficiary"]),
  };
}

function recordInEc(record: FacedRecordData): boolean {
  return isRecordInsideEc(record);
}

function ecSiteName(record: FacedRecordData): string {
  return evacuationSiteLabel(record);
}

function memberCount(record: TursoExportRecord): number {
  const named = (record.family_members ?? []).filter((m) => m.family_member_name?.trim()).length;
  return 1 + named;
}

function personsFromRecord(record: TursoExportRecord): PersonRow[] {
  const inEc = recordInEc(record);
  const head = record.head_of_family;
  const rows: PersonRow[] = [];

  const headSex = normalizeSex(head.sex, head.male, head.female);
  const headGroup = computeAgeGroup(head.age, parseAgeYears(head.age));
  rows.push({
    sex: headSex,
    ageGroup: headGroup || (headSex ? "ADULT" : ""),
    inEc,
    sectoral: sectoralFromPerson(head, null, record, true),
  });

  for (const member of record.family_members ?? []) {
    const name = member.family_member_name?.trim();
    if (!name) continue;
    const sex = normalizeSex(member.sex);
    const group = computeAgeGroup(member.age, parseAgeYears(member.age));
    rows.push({
      sex: sex,
      ageGroup: group || (sex ? "ADULT" : ""),
      inEc,
      sectoral: sectoralFromPerson(head, member, record, false),
    });
  }

  return rows;
}

function emptyAgeSex(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const group of AGE_GROUPS) {
    for (const sex of ["M", "F"] as const) {
      result[`${group}_${sex}_cum`] = 0;
      result[`${group}_${sex}_now`] = 0;
    }
  }
  return result;
}

function countAgeSex(persons: PersonRow[]): Record<string, number> {
  const result = emptyAgeSex();
  for (const person of persons) {
    if (person.sex !== "M" && person.sex !== "F") continue;
    const group = person.ageGroup;
    if (!group || !AGE_GROUPS.includes(group as (typeof AGE_GROUPS)[number])) continue;
    result[`${group}_${person.sex}_cum`] += 1;
    if (person.inEc) result[`${group}_${person.sex}_now`] += 1;
  }
  return result;
}

function ageDistributionRows(ageSex: Record<string, number>, detailed = true): AgeRow[] {
  return AGE_GROUPS.map((group) => {
    const male_cum = ageSex[`${group}_M_cum`] ?? 0;
    const male_now = ageSex[`${group}_M_now`] ?? 0;
    const female_cum = ageSex[`${group}_F_cum`] ?? 0;
    const female_now = ageSex[`${group}_F_now`] ?? 0;
    return {
      group,
      label: group
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace("-", "-"),
      range: AGE_GROUP_LABELS[group] ?? "",
      male_cum,
      male_now,
      female_cum,
      female_now,
      total_cum: male_cum + female_cum,
      total_now: male_now + female_now,
    };
  });
}

function countSectoral(persons: PersonRow[]): SectoralRow[] {
  return SECTORAL_LABELS.map(([key, label]) => {
    let male_cum = 0;
    let male_now = 0;
    let female_cum = 0;
    let female_now = 0;
    for (const person of persons) {
      if (!person.sectoral[key]) continue;
      if (person.sex === "M") {
        male_cum += 1;
        if (person.inEc) male_now += 1;
      } else if (person.sex === "F") {
        female_cum += 1;
        if (person.inEc) female_now += 1;
      }
    }
    return {
      label,
      male_cum,
      male_now,
      female_cum,
      female_now,
      total_cum: male_cum + female_cum,
      total_now: male_now + female_now,
    };
  });
}

function sumAgeRows(rows: AgeRow[]) {
  return rows.reduce(
    (acc, row) => ({
      male_cum: acc.male_cum + row.male_cum,
      male_now: acc.male_now + row.male_now,
      female_cum: acc.female_cum + row.female_cum,
      female_now: acc.female_now + row.female_now,
      total_cum: acc.total_cum + row.total_cum,
      total_now: acc.total_now + row.total_now,
    }),
    { male_cum: 0, male_now: 0, female_cum: 0, female_now: 0, total_cum: 0, total_now: 0 },
  );
}

function classifyShelterDamage(record: FacedRecordData): "totally" | "partially" | "not_identified" | null {
  const s = record.shelter_damage_classification;
  if (s?.totally_damaged) return "totally";
  if (s?.partially_damaged) return "partially";
  if (s?.not_identified) return "not_identified";
  return "not_identified";
}

function shelterData(records: TursoExportRecord[]): ShelterPayload {
  const damage = { totally: 0, partially: 0, not_identified: 0 };
  const ownership = {
    owner: 0,
    renter: 0,
    sharer: 0,
    informal_settler: 0,
    not_identified: 0,
  };

  for (const record of records) {
    const dKey = classifyShelterDamage(record);
    if (dKey) damage[dKey] += 1;

    const h = record.house_ownership;
    if (h?.owner) ownership.owner += 1;
    else if (h?.renter) ownership.renter += 1;
    else if (h?.sharer) ownership.sharer += 1;
    else if (h?.not_identified) ownership.not_identified += 1;
    else ownership.not_identified += 1;
  }

  return {
    damage: { ...damage, total: damage.totally + damage.partially + damage.not_identified },
    ownership: {
      ...ownership,
      total:
        ownership.owner +
        ownership.renter +
        ownership.sharer +
        ownership.informal_settler +
        ownership.not_identified,
    },
  };
}

function insideEcGroups(records: TursoExportRecord[]): InsideEcGroup[] {
  const buckets = new Map<string, InsideEcGroup>();

  for (const record of records) {
    if (!recordInEc(record)) continue;
    const ecName = ecSiteName(record);
    if (ecName === OUTSIDE_EC_LABEL) continue;
    const key = ecName.toUpperCase();
    if (!buckets.has(key)) {
      buckets.set(key, {
        ec_name: ecName,
        ec_address: [record.city_municipality, record.province].filter(Boolean).join(", "),
        by_barangay: [],
        totals: {
          families_cum: 0,
          families_now: 0,
          persons_cum: 0,
          persons_now: 0,
          shelter: { totally: 0, partially: 0, not_identified: 0 },
        },
      });
    }
    const group = buckets.get(key)!;
    const rawBarangay = record.barangay?.trim() || "Unknown";
    const barangay = formatDisplayBarangay(rawBarangay, record.city_municipality);
    let row = group.by_barangay.find((b) => b.barangay.toUpperCase() === rawBarangay.toUpperCase());
    if (!row) {
      row = {
        barangay,
        families_cum: 0,
        families_now: 0,
        persons_cum: 0,
        persons_now: 0,
        shelter: { totally: 0, partially: 0, not_identified: 0 },
      };
      group.by_barangay.push(row);
    }

    const persons = personsFromRecord(record);
    row.families_cum += 1;
    row.families_now += 1;
    row.persons_cum += persons.length;
    row.persons_now += persons.length;

    const shelterKey = classifyShelterDamage(record);
    if (shelterKey && row.shelter) row.shelter[shelterKey] += 1;

    group.totals.families_cum += 1;
    group.totals.families_now += 1;
    group.totals.persons_cum += persons.length;
    group.totals.persons_now += persons.length;
    if (shelterKey && group.totals.shelter) group.totals.shelter[shelterKey] += 1;
  }

  return [...buckets.values()]
    .map((group) => ({
      ...group,
      by_barangay: group.by_barangay.sort((a, b) => b.persons_cum - a.persons_cum || a.barangay.localeCompare(b.barangay)),
    }))
    .sort((a, b) => b.totals.persons_cum - a.totals.persons_cum || a.ec_name.localeCompare(b.ec_name));
}

function buildInfoBoardFromRecords(
  groupRecords: TursoExportRecord[],
  ecName: string,
  address: string,
  barangay?: string,
): InfoBoardGroup {
  const persons = groupRecords.flatMap(personsFromRecord);
  const ageRows = ageDistributionRows(countAgeSex(persons), true);
  const first = groupRecords[0];

  return {
    ec_name: ecName,
    ec_address: [first?.city_municipality, first?.province || SARANGANI_PROVINCE].filter(Boolean).join(", "),
    region: first?.region?.trim() || SARANGANI_REGION,
    address,
    barangay: barangay?.trim() || undefined,
    families_cum: groupRecords.length,
    families_now: 0,
    persons_cum: persons.length,
    persons_now: 0,
    age_distribution: ageRows,
    sectoral: countSectoral(persons),
  };
}

function emptyOutsideInfoBoard(address = "—"): InfoBoardGroup {
  return {
    ec_name: OUTSIDE_EC_LABEL,
    ec_address: "",
    region: SARANGANI_REGION,
    address,
    families_cum: 0,
    families_now: 0,
    persons_cum: 0,
    persons_now: 0,
    age_distribution: ageDistributionRows(emptyAgeSex(), true),
    sectoral: countSectoral([]),
  };
}

function outsideEcBundle(records: TursoExportRecord[], cityMunFilter = ""): ReportsBundle["outside_ec"] {
  const barangays = new Map<string, BarangayRow>();
  const recordsByBarangay = new Map<string, TursoExportRecord[]>();
  const outsideRecords: TursoExportRecord[] = [];

  for (const record of records) {
    if (recordInEc(record)) continue;
    outsideRecords.push(record);

    const barangay = formatDisplayBarangay(record.barangay?.trim() || "Unknown", record.city_municipality);
    const key = barangay.toUpperCase();
    let row = barangays.get(key);
    if (!row) {
      row = {
        barangay,
        families_cum: 0,
        families_now: 0,
        persons_cum: 0,
        persons_now: 0,
        shelter: { totally: 0, partially: 0, not_identified: 0 },
      };
      barangays.set(key, row);
    }

    const barangayRecords = recordsByBarangay.get(key) ?? [];
    barangayRecords.push(record);
    recordsByBarangay.set(key, barangayRecords);

    const persons = memberCount(record);
    row.families_cum += 1;
    row.persons_cum += persons;

    const shelterKey = classifyShelterDamage(record);
    if (shelterKey && row.shelter) row.shelter[shelterKey] += 1;
  }

  const by_barangay = [...barangays.values()].sort(
    (a, b) => b.persons_cum - a.persons_cum || a.barangay.localeCompare(b.barangay),
  );

  const totals = {
    families_cum: 0,
    families_now: 0,
    persons_cum: 0,
    persons_now: 0,
    shelter: { totally: 0, partially: 0, not_identified: 0 },
  };

  for (const row of by_barangay) {
    totals.families_cum += row.families_cum;
    totals.persons_cum += row.persons_cum;
    if (row.shelter) {
      totals.shelter!.totally += row.shelter.totally;
      totals.shelter!.partially += row.shelter.partially;
      totals.shelter!.not_identified += row.shelter.not_identified;
    }
  }

  const summaryAddress = cityMunFilter.trim()
    ? cityMunFilter.trim()
    : outsideRecords[0]?.city_municipality
      ? `${outsideRecords[0].city_municipality}, ${SARANGANI_PROVINCE}`
      : SARANGANI_PROVINCE;

  const summary_board =
    outsideRecords.length > 0
      ? buildInfoBoardFromRecords(outsideRecords, OUTSIDE_EC_LABEL, summaryAddress)
      : emptyOutsideInfoBoard(summaryAddress);

  const barangay_groups = [...recordsByBarangay.entries()]
    .map(([, groupRecords]) => {
      const first = groupRecords[0];
      return buildInfoBoardFromRecords(
        groupRecords,
        OUTSIDE_EC_LABEL,
        [first?.city_municipality, formatDisplayBarangay(first?.barangay ?? "", first?.city_municipality)]
          .filter(Boolean)
          .join(", "),
        formatDisplayBarangay(first?.barangay ?? "", first?.city_municipality) || "Unknown",
      );
    })
    .sort((a, b) => b.persons_cum - a.persons_cum || a.address.localeCompare(b.address));

  return {
    ec_name: OUTSIDE_EC_LABEL,
    totals,
    by_barangay,
    summary_board,
    barangay_groups,
  };
}

function infoBoardGroups(records: TursoExportRecord[]): InfoBoardGroup[] {
  const insideRecords = records.filter(recordInEc);
  const ecGroups = new Map<string, TursoExportRecord[]>();

  for (const record of insideRecords) {
    const site = ecSiteName(record);
    if (site === OUTSIDE_EC_LABEL) continue;
    const key = site.toUpperCase();
    const list = ecGroups.get(key) ?? [];
    list.push(record);
    ecGroups.set(key, list);
  }

  return [...ecGroups.entries()].map(([, groupRecords]) => {
    const persons = groupRecords.flatMap(personsFromRecord);
    const ageRows = ageDistributionRows(countAgeSex(persons), true);
    const first = groupRecords[0];
    const ecName = ecSiteName(first);
    const families = groupRecords.length;
    const personCount = persons.length;

    return {
      ec_name: ecName,
      ec_address: [first.city_municipality, first.province].filter(Boolean).join(", "),
      region: first.region?.trim() || SARANGANI_REGION,
      address: [first.city_municipality, first.barangay].filter(Boolean).join(", "),
      families_cum: families,
      families_now: families,
      persons_cum: personCount,
      persons_now: personCount,
      age_distribution: ageRows,
      sectoral: countSectoral(persons),
    };
  });
}

export async function loadDashboardRecords(cityMun?: string): Promise<TursoExportRecord[]> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const municipality = cityMun?.trim();

  const result = municipality
    ? await db.execute({
        sql: `
          ${FACED_EXPORT_SELECT}
          ${facedRecordsWhere("LOWER(TRIM(city_municipality)) = ?")}
          ORDER BY city_municipality, barangay, updated_at DESC
        `,
        args: [normMunicipality(municipality)],
      })
    : await db.execute({
        sql: `
          ${FACED_EXPORT_SELECT}
          ${facedRecordsWhere()}
          ORDER BY city_municipality, barangay, updated_at DESC
        `,
      });

  const records: TursoExportRecord[] = [];
  for (const row of result.rows) {
    const parsed = parseTursoFacedRecordRow(row);
    if (parsed) records.push(parsed);
  }
  return records;
}

export async function listDashboardMunicipalities(): Promise<MunicipalityOption[]> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const result = await db.execute({
    sql: `
      SELECT TRIM(city_municipality) AS city_mun, COUNT(*) AS heads_count
      FROM faced_records
      WHERE deleted_at IS NULL
        AND TRIM(COALESCE(city_municipality, '')) != ''
      GROUP BY LOWER(TRIM(city_municipality))
      ORDER BY heads_count DESC, city_mun ASC
    `,
  });

  const counts = new Map<string, number>();
  for (const row of result.rows) {
    const city = String(row.city_mun ?? "").trim();
    if (!city) continue;
    counts.set(city, Number(row.heads_count ?? 0));
  }

  const options: MunicipalityOption[] = SARANGANI_MUNICIPALITIES.map((city) => ({
    city_mun: city,
    heads_count: counts.get(city) ?? 0,
  }));

  for (const [city, heads_count] of counts) {
    if (!SARANGANI_MUNICIPALITIES.includes(city as (typeof SARANGANI_MUNICIPALITIES)[number])) {
      options.push({ city_mun: city, heads_count });
    }
  }

  return options.sort((a, b) => b.heads_count - a.heads_count || a.city_mun.localeCompare(b.city_mun));
}

export function buildReportsBundle(
  records: TursoExportRecord[],
  cityMunFilter = "",
): ReportsBundle {
  const allPersons = records.flatMap(personsFromRecord);
  const ageRows = ageDistributionRows(countAgeSex(allPersons), true);
  const sectoralRows = countSectoral(allPersons);
  const insideGroups = insideEcGroups(records);
  const outsideEc = outsideEcBundle(records, cityMunFilter);
  const infoGroups = infoBoardGroups(records);

  const insideTotals = insideGroups.reduce(
    (acc, g) => ({
      families_cum: acc.families_cum + g.totals.families_cum,
      families_now: acc.families_now + g.totals.families_now,
      persons_cum: acc.persons_cum + g.totals.persons_cum,
      persons_now: acc.persons_now + g.totals.persons_now,
    }),
    { families_cum: 0, families_now: 0, persons_cum: 0, persons_now: 0 },
  );

  return {
    inside_ec: {
      ec_name: insideGroups.length === 1 ? insideGroups[0]?.ec_name ?? "" : `${insideGroups.length} EC Sites`,
      ec_sites_count: insideGroups.length,
      totals: insideTotals,
      groups: insideGroups,
    },
    outside_ec: outsideEc,
    sex_age_sectoral: {
      age_distribution: ageRows,
      sectoral: sectoralRows,
      totals: sumAgeRows(ageRows),
    },
    info_board: {
      region: SARANGANI_REGION,
      families_cum: infoGroups.reduce((s, g) => s + g.families_cum, 0),
      families_now: infoGroups.reduce((s, g) => s + g.families_now, 0),
      persons_cum: infoGroups.reduce((s, g) => s + g.persons_cum, 0),
      persons_now: infoGroups.reduce((s, g) => s + g.persons_now, 0),
      groups: infoGroups,
    },
    shelter: shelterData(records),
    municipalities: [],
    city_mun_filter: cityMunFilter,
    total_records: records.length,
    inside_ec_records: records.filter(recordInEc).length,
    outside_ec_records: records.filter((r) => !recordInEc(r)).length,
  };
}
