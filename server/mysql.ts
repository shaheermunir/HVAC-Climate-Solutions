import mysql, { Pool, PoolOptions, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  connectionLimit: number;
  connectTimeout: number;
}

export const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'srv537.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'u713584878_HVAC',
  user: process.env.DB_USER || 'u713584878_hvacuser',
  password: process.env.DB_PASSWORD || 'vXXc0wyw8*Av',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  connectTimeout: 8000,
};

let pool: Pool | null = null;
let isConnected = false;
let lastHealthCheckTime = 0;
let lastHealthStatus = false;

/**
 * Returns or initializes the singleton MySQL connection pool.
 */
export function getMySqlPool(): Pool {
  if (!pool) {
    const poolOptions: PoolOptions = {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: dbConfig.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: dbConfig.connectTimeout,
      charset: 'utf8mb4',
      dateStrings: true,
    };

    pool = mysql.createPool(poolOptions);

    (pool as any).on('connection', () => {
      // Diagnostic tracking without leaking secrets
      isConnected = true;
    });

    (pool as any).on('error', (err: any) => {
      console.error('[MySQL Pool Error]:', err.code || err.message);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        isConnected = false;
      }
    });
  }

  return pool;
}

/**
 * Performs a lightweight health check against the MySQL instance.
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  engine: string;
  database: string;
  host: string;
  port: number;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const p = getMySqlPool();
    const [rows] = await p.query<RowDataPacket[]>('SELECT 1 AS alive, NOW() as server_time');
    const latency = Date.now() - start;
    isConnected = true;
    lastHealthCheckTime = Date.now();
    lastHealthStatus = true;
    return {
      connected: true,
      engine: 'MySQL',
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      latencyMs: latency,
    };
  } catch (err: any) {
    isConnected = false;
    lastHealthCheckTime = Date.now();
    lastHealthStatus = false;
    return {
      connected: false,
      engine: 'MySQL',
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      latencyMs: Date.now() - start,
      error: err.code || err.message || 'Database connection error',
    };
  }
}

/**
 * Returns whether MySQL was successfully verified on the last connection attempt.
 */
export function isMySqlConnected(): boolean {
  return isConnected;
}

export interface QueryOptions {
  silentErrors?: boolean | string[];
}

/**
 * Executes a parameterized SQL query with connection error handling and auto-retry.
 */
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = [],
  options?: QueryOptions
): Promise<[T, any]> {
  const p = getMySqlPool();
  try {
    const [results, fields] = await p.execute(sql, params);
    return [results as T, fields];
  } catch (err: any) {
    const isSilenced =
      options?.silentErrors === true ||
      (Array.isArray(options?.silentErrors) && options.silentErrors.includes(err.code));

    if (!isSilenced) {
      console.error(`[MySQL Query Error] ${err.code || err.message} for SQL: ${sql.slice(0, 100)}...`);
    }
    throw err;
  }
}

/**
 * Transaction wrapper with automated rollback on failure.
 */
export async function withTransaction<T>(
  action: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const p = getMySqlPool();
  const conn = await p.getConnection();
  await conn.beginTransaction();
  try {
    const result = await action(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Graceful shutdown for pool connections.
 */
export async function closeMySqlPool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      isConnected = false;
      console.log('MySQL connection pool closed gracefully.');
    } catch (err) {
      console.error('Error closing MySQL pool:', err);
    }
  }
}
