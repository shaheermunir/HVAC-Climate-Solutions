import fs from 'fs';
import path from 'path';
import mysql, { RowDataPacket } from 'mysql2/promise';
import { dbConfig } from '../server/mysql';

export async function runMigrations(): Promise<{ success: boolean; applied: string[] }> {
  console.log(`[Migrations] Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);
  
  // Create connection with multipleStatements: true for schema migration execution
  const conn = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    multipleStatements: true,
    connectTimeout: 10000,
  });

  const appliedList: string[] = [];

  try {
    // 1. Ensure migrations table exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Fetch already applied migrations
    const [rows] = await conn.query<RowDataPacket[]>('SELECT version FROM schema_migrations ORDER BY id ASC');
    const appliedVersions = new Set(rows.map((r) => r.version));

    // 3. Find all migration files
    const migrationsDir = path.resolve(process.cwd(), 'database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migrations] No database/migrations directory found.');
      return { success: true, applied: [] };
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const version = file.split('_')[0];
      if (appliedVersions.has(version)) {
        console.log(`[Migrations] Migration ${file} is already applied. Skipping.`);
        continue;
      }

      console.log(`[Migrations] Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute migration SQL
      await conn.query(sql);

      // Record migration
      await conn.query(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
        [version, file]
      );

      appliedList.push(file);
      console.log(`[Migrations] Successfully applied: ${file}`);
    }

    console.log(`[Migrations] All migrations completed. Total applied in this run: ${appliedList.length}`);
    return { success: true, applied: appliedList };
  } catch (error: any) {
    console.error('[Migrations Error]:', error.message || error);
    throw error;
  } finally {
    await conn.end();
  }
}

// If run directly from CLI (e.g. `npm run migrate` or `tsx database/migrate.ts`)
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then((res) => {
      console.log(`Migration script finished: ${res.applied.length} applied.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
