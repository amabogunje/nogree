import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const migrationPath = process.argv[2];
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!migrationPath || !databaseUrl) {
  throw new Error('Usage: node scripts/apply-migration.js <migration-file>');
}

const migration = await readFile(migrationPath, 'utf8');
const sql = neon(databaseUrl);

const statements = migration
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${migrationPath}`);
