import {
  FACED_EXPORT_SELECT,
  parseTursoFacedRecordRow,
} from "./faced-export-shared";
import { ensureTursoSchema, getTursoClient } from "./turso";
import type { FacedRecordListItem, ListFacedRecordsInput, ListFacedRecordsResult } from "./records-admin";
import { facedRecordToListItem } from "./records-admin";

const TRASH_WHERE = "WHERE deleted_at IS NOT NULL";

const RECORDS_SEARCH_CLAUSE = `
  LOWER(uuid) LIKE ?
  OR LOWER(COALESCE(enumerator_name, '')) LIKE ?
  OR LOWER(COALESCE(barangay, '')) LIKE ?
  OR LOWER(COALESCE(city_municipality, '')) LIKE ?
  OR LOWER(COALESCE(access_code, '')) LIKE ?
  OR LOWER(json_extract(payload, '$.head_of_family.first_name')) LIKE ?
  OR LOWER(json_extract(payload, '$.head_of_family.middle_name')) LIKE ?
  OR LOWER(json_extract(payload, '$.head_of_family.last_name')) LIKE ?
`;

function parseRowListItem(row: Record<string, unknown>): FacedRecordListItem | null {
  const parsed = parseTursoFacedRecordRow(row);
  if (!parsed) return null;
  return facedRecordToListItem(row, parsed);
}

export async function countFacedRecordsTrash(): Promise<number> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS total FROM faced_records ${TRASH_WHERE}`,
  });
  return Number(result.rows[0]?.total ?? 0);
}

export async function listFacedRecordsTrashAdmin(
  input: ListFacedRecordsInput = {},
): Promise<ListFacedRecordsResult> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const search = input.search?.trim().toLowerCase() ?? "";
  const offset = (page - 1) * pageSize;

  await ensureTursoSchema();
  const db = getTursoClient();

  if (search) {
    const like = `%${search}%`;
    const searchArgs = [like, like, like, like, like, like, like, like];
    const where = `${TRASH_WHERE} AND (${RECORDS_SEARCH_CLAUSE})`;

    const [countResult, listResult] = await Promise.all([
      db.execute({
        sql: `SELECT COUNT(*) AS total FROM faced_records ${where}`,
        args: searchArgs,
      }),
      db.execute({
        sql: `
          ${FACED_EXPORT_SELECT}
          ${where}
          ORDER BY deleted_at DESC
          LIMIT ? OFFSET ?
        `,
        args: [...searchArgs, pageSize, offset],
      }),
    ]);

    const records = listResult.rows
      .map((row) => parseRowListItem(row as Record<string, unknown>))
      .filter((item): item is FacedRecordListItem => item !== null);

    return {
      records,
      total: Number(countResult.rows[0]?.total ?? 0),
      page,
      pageSize,
    };
  }

  const [countResult, listResult] = await Promise.all([
    db.execute({
      sql: `SELECT COUNT(*) AS total FROM faced_records ${TRASH_WHERE}`,
    }),
    db.execute({
      sql: `
        ${FACED_EXPORT_SELECT}
        ${TRASH_WHERE}
        ORDER BY deleted_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [pageSize, offset],
    }),
  ]);

  const records = listResult.rows
    .map((row) => parseRowListItem(row as Record<string, unknown>))
    .filter((item): item is FacedRecordListItem => item !== null);

  return {
    records,
    total: Number(countResult.rows[0]?.total ?? 0),
    page,
    pageSize,
  };
}
