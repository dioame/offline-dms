import type { Client } from "@libsql/client";
import { MIGRATIONS } from "./migrations-manifest";

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

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      await db.execute(statement);
    }

    await db.execute({
      sql: "INSERT INTO schema_migrations (id) VALUES (?)",
      args: [id],
    });

    applied.push(id);
    console.log(`  Applied: ${filename}`);
  }

  return { applied, skipped };
}
