import { createClient } from "@libsql/client";
import { backfillFacedRecordAccessCodes } from "../src/lib/backfill-access-codes";
import { getTursoEnv } from "../src/lib/env";
import { runMigrations } from "../src/lib/run-migrations";

async function main() {
  const { url } = getTursoEnv();
  const db = createClient({ url });

  console.log("Running database migrations...\n");

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
