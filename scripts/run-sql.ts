/**
 * Apply the repo's SQL files to the Supabase Postgres database, in order.
 * Needs DATABASE_URL in .env.local (Supabase dashboard → Connect → URI).
 *
 *   node --experimental-strip-types scripts/run-sql.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

function loadLocalEnv(): void {
  const path = resolve(import.meta.dirname, "../.env.local");
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const DEFAULT_FILES = [
  "01_schema.sql",
  "04_comp_seats.sql",
  "03_seed.sql",
  "02_create_booking.sql",
];

/** Pass file names as args to run a subset, e.g. 05_student_names.sql */
const FILES = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_FILES;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "Missing DATABASE_URL in .env.local (Supabase dashboard → Connect → URI).",
  );
  process.exit(1);
}

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const { rows } = await client.query(
    "select current_database() as db, current_user as usr",
  );
  console.log(`Connected: db=${rows[0].db} user=${rows[0].usr}\n`);

  for (const name of FILES) {
    const sql = readFileSync(resolve(import.meta.dirname, `../sql/${name}`), "utf8");
    process.stdout.write(`== sql/${name} ... `);
    try {
      await client.query(sql);
      console.log("OK");
    } catch (error) {
      console.log("FAILED");
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  const counts = await client.query(`
    select
      (select count(*) from students) as students,
      (select count(*) from tables) as tables,
      (select count(*) from tables where blocked) as blocked,
      (select count(*) from pg_proc where proname = 'create_booking') as rpc
  `);
  console.log("\nPost-apply counts:", counts.rows[0]);
} finally {
  await client.end();
}
