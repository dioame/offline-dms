import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Client } from "@libsql/client";

function parseSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((part) =>
      part
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

async function executeStatement(db: Client, statement: string): Promise<void> {
  try {
    await db.execute(statement);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("duplicate column name")) {
      return;
    }
    throw err;
  }
}

export async function runMigrations(db: Client): Promise<{
  applied: string[];
  skipped: string[];
}> {
  const migrationsDir = join(process.cwd(), "migrations");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const id = file.replace(/\.sql$/, "");
    const existing = await db.execute({
      sql: "SELECT id FROM _migrations WHERE id = ?",
      args: [id],
    });

    if (existing.rows.length > 0) {
      skipped.push(id);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const statements = parseSqlStatements(sql);

    for (const statement of statements) {
      await executeStatement(db, statement);
    }

    await db.execute({
      sql: "INSERT INTO _migrations (id, name, applied_at) VALUES (?, ?, ?)",
      args: [id, file, new Date().toISOString()],
    });

    applied.push(id);
  }

  return { applied, skipped };
}
