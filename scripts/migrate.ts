import { createClient } from "@libsql/client";
import { backfillFacedRecordAccessCodes } from "../src/lib/backfill-access-codes";
import { runMigrations } from "../src/lib/run-migrations";

async function main() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url || !authToken) {
    console.error(
      "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.\n" +
        "Fill in .env then run: npm run migrate",
    );
    process.exit(1);
  }

  const db = createClient({ url, authToken });

  console.log("Running Turso migrations...\n");

  const { applied, skipped } = await runMigrations(db);

  const backfilled = await backfillFacedRecordAccessCodes(db);

  console.log("");
  if (applied.length === 0 && skipped.length > 0) {
    console.log(
      `Database up to date (${skipped.length} migration(s) already applied).`,
    );
  } else if (applied.length > 0) {
    console.log(`Applied ${applied.length} migration(s).`);
    for (const id of applied) console.log(`  ✓ ${id}`);
    if (skipped.length > 0) {
      console.log(`Skipped ${skipped.length} already applied.`);
    }
  } else {
    console.log("Nothing to migrate.");
  }

  if (backfilled > 0) {
    console.log(`Backfilled access_code on ${backfilled} faced record(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
