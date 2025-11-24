/**
 * Database utilities for D1 (SQLite)
 */

export interface DbResult<T = any> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

/**
 * Execute a query and return results
 */
export async function query<T = any>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results || [];
}

/**
 * Execute a query and return first result
 */
export async function queryOne<T = any>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result || null;
}

/**
 * Execute a query and return metadata
 */
export async function execute(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<D1Result> {
  return await db.prepare(sql).bind(...params).run();
}

/**
 * Parse JSON fields from database
 */
export function parseJsonField<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Stringify JSON for database storage
 */
export function stringifyJsonField(value: any): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

/**
 * Parse array from JSON string or comma-separated string
 */
export function parseArrayField(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Fallback to comma-separated
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
}

/**
 * Stringify array for database storage
 */
export function stringifyArrayField(value: string[]): string | null {
  if (!value || value.length === 0) return null;
  return JSON.stringify(value);
}

