import type { Client } from "@libsql/client";
import { MIGRATIONS } from "./migrations-manifest";

const ADD_COLUMN_PATTERN =
  /ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i;

function stripSqlComments(statement: string): string {
  return statement
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
}

function splitMigrationStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((segment) => stripSqlComments(segment))
    .filter((statement) => statement.length > 0);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

function isIgnorableMigrationError(err: unknown): boolean {
  const message = getErrorMessage(err);
  return (
    /duplicate column name:/i.test(message) ||
    /already exists/i.test(message)
  );
}

async function columnExists(
  db: Client,
  table: string,
  column: string,
): Promise<boolean> {
  const info = await db.execute(`PRAGMA table_info(${table})`);
  return info.rows.some((row) => {
    const record = row as Record<string, unknown>;
    return record.name === column || record[1] === column;
  });
}

async function executeMigrationStatement(
  db: Client,
  statement: string,
): Promise<void> {
  const addColumn = ADD_COLUMN_PATTERN.exec(statement);
  if (addColumn) {
    const [, table, column] = addColumn;
    if (await columnExists(db, table, column)) {
      return;
    }
  }

  try {
    await db.execute(statement);
  } catch (err) {
    if (isIgnorableMigrationError(err)) return;
    throw err;
  }
}

export async function runMigrations(db: Client) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const { id, filename, sql } of MIGRATIONS) {
    const existing = await db.execute({
      sql: "SELECT id FROM schema_migrations WHERE id = ?",
      args: [id],
    });

    if (existing.rows.length > 0) {
      skipped.push(id);
      continue;
    }

    const statements = splitMigrationStatements(sql);

    for (const statement of statements) {
      await executeMigrationStatement(db, statement);
    }

    await db.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)",
      args: [id],
    });

    applied.push(id);
    console.log(`  Applied: ${filename}`);
  }

  return { applied, skipped };
}
