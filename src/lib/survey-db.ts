import {
  SURVEY_BENEFIT_OPTIONS,
  SURVEY_EVALUATION_STATEMENTS,
  SURVEY_SUSTAINABILITY_STATEMENTS,
  type SurveyAnalytics,
  type SurveyPayload,
  type SurveyResponseRow,
  type SurveyScale,
  validateSurveyPayload,
} from "./survey-types";
import { ensureTursoSchema, getTursoClient } from "./turso";

function tryParsePayload(raw: string): SurveyPayload | null {
  try {
    return validateSurveyPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

function rowToSurveyResponse(row: Record<string, unknown>): SurveyResponseRow | null {
  const payload = tryParsePayload(String(row.payload));
  if (!payload) return null;

  return {
    id: Number(row.id),
    name: row.name ? String(row.name) : null,
    region_field_office: payload.region_field_office,
    payload,
    created_at: String(row.created_at),
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

function scaleAverage(
  responses: SurveyResponseRow[],
  pick: (payload: SurveyPayload) => SurveyScale,
): number | null {
  return average(responses.map((row) => pick(row.payload)));
}

export async function insertSurveyResponse(payload: SurveyPayload): Promise<SurveyResponseRow> {
  const validated = validateSurveyPayload(payload);
  await ensureTursoSchema();
  const db = getTursoClient();
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: `
      INSERT INTO usability_survey_responses (name, municipality, payload, created_at)
      VALUES (?, ?, ?, ?)
    `,
    args: [
      validated.name ?? null,
      validated.region_field_office,
      JSON.stringify(validated),
      now,
    ],
  });

  const id = Number(result.lastInsertRowid);
  const rows = await db.execute({
    sql: `
      SELECT id, name, municipality, payload, created_at
      FROM usability_survey_responses
      WHERE id = ?
    `,
    args: [id],
  });

  const row = rows.rows[0];
  if (!row) {
    throw new Error("Survey response could not be loaded after save.");
  }

  const parsed = rowToSurveyResponse(row as Record<string, unknown>);
  if (!parsed) {
    throw new Error("Survey response could not be parsed after save.");
  }

  return parsed;
}

export async function listSurveyResponses(limit = 500): Promise<SurveyResponseRow[]> {
  await ensureTursoSchema();
  const db = getTursoClient();

  const result = await db.execute({
    sql: `
      SELECT id, name, municipality, payload, created_at
      FROM usability_survey_responses
      ORDER BY created_at DESC
      LIMIT ?
    `,
    args: [Math.min(Math.max(limit, 1), 5000)],
  });

  return result.rows
    .map((row) => rowToSurveyResponse(row as Record<string, unknown>))
    .filter((row): row is SurveyResponseRow => row !== null);
}

export async function getSurveyAnalytics(): Promise<SurveyAnalytics> {
  const responses = await listSurveyResponses(5000);

  const evaluation_averages: Record<string, number | null> = {};
  for (const { key, label } of SURVEY_EVALUATION_STATEMENTS) {
    evaluation_averages[label] = scaleAverage(responses, (p) => p[key] as SurveyScale);
  }

  const sustainability_averages: Record<string, number | null> = {};
  for (const { key, label } of SURVEY_SUSTAINABILITY_STATEMENTS) {
    sustainability_averages[label] = scaleAverage(responses, (p) => p[key] as SurveyScale);
  }

  const informed = { yes: 0, no: 0 };
  const workImprovementCounts = new Map<string, number>();
  const overallRatingCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();
  const usageDurationCounts = new Map<string, number>();
  const benefitCounts = new Map<string, number>(
    SURVEY_BENEFIT_OPTIONS.map(({ label }) => [label, 0]),
  );

  for (const row of responses) {
    const p = row.payload;
    if (p.informed === "Yes") informed.yes += 1;
    else informed.no += 1;

    workImprovementCounts.set(
      p.work_improvement,
      (workImprovementCounts.get(p.work_improvement) ?? 0) + 1,
    );
    overallRatingCounts.set(
      p.overall_rating,
      (overallRatingCounts.get(p.overall_rating) ?? 0) + 1,
    );
    regionCounts.set(
      p.region_field_office,
      (regionCounts.get(p.region_field_office) ?? 0) + 1,
    );
    usageDurationCounts.set(
      p.usage_duration,
      (usageDurationCounts.get(p.usage_duration) ?? 0) + 1,
    );

    for (const { key, label } of SURVEY_BENEFIT_OPTIONS) {
      if (p.benefits[key]) {
        benefitCounts.set(label, (benefitCounts.get(label) ?? 0) + 1);
      }
    }
  }

  return {
    total_responses: responses.length,
    evaluation_averages,
    sustainability_averages,
    overall_stars_average: scaleAverage(responses, (p) => p.overall_stars),
    informed,
    work_improvement: [...workImprovementCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    overall_rating: [...overallRatingCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    benefit_counts: [...benefitCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    by_region: [...regionCounts.entries()]
      .map(([region_field_office, count]) => ({ region_field_office, count }))
      .sort((a, b) => b.count - a.count || a.region_field_office.localeCompare(b.region_field_office)),
    by_usage_duration: [...usageDurationCounts.entries()]
      .map(([usage_duration, count]) => ({ usage_duration, count }))
      .sort((a, b) => b.count - a.count),
    recent: responses.slice(0, 25),
  };
}
