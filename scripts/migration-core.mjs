import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

/**
 * @param {import("@libsql/client").Client} db
 */
export async function runMigrations(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return { applied: [], skipped: [] };
  }

  const applied = [];
  const skipped = [];

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

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    const statements = parseSqlStatements(sql);

    for (const statement of statements) {
      await db.execute(statement);
    }

    await db.execute({
      sql: "INSERT INTO _migrations (id, name, applied_at) VALUES (?, ?, ?)",
      args: [id, file, new Date().toISOString()],
    });

    applied.push(id);
    console.log(`  ✓ ${id}`);
  }

  return { applied, skipped };
}

function parseSqlStatements(sql) {
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
