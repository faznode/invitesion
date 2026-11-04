import { CONTENT_SCHEMA_VERSION } from './content-contract';
import { detailConfigSchema, type DetailConfig } from './detail-config';

export type NormalizedConfig = { config: DetailConfig; version: number; dropped: string[] };

/**
 * Read path for stored configs. The strict schema stays on the write path; reading is lenient per section, so a
 * config written by an older version (or containing a section today's rules reject) loses only that section instead
 * of rendering as an empty invitation. `dropped` names the removed top-level keys (never their values) for logging.
 * `schemaVersion` absent = 1 (every config written before the field existed); there is no migration step yet because
 * version 1 is the only version.
 */
export function normalizeStoredConfig(raw: unknown): NormalizedConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { config: {}, version: CONTENT_SCHEMA_VERSION, dropped: [] };
  const record = raw as Record<string, unknown>;
  const version = typeof record.schemaVersion === 'number' && Number.isInteger(record.schemaVersion) ? record.schemaVersion : 1;
  const shape = detailConfigSchema.shape as Record<string, { safeParse: (value: unknown) => { success: boolean; data?: unknown } }>;
  const kept: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (key === 'schemaVersion') continue;
    const parsed = shape[key]?.safeParse(value);
    if (parsed?.success) kept[key] = parsed.data;
    else dropped.push(key);
  }
  const whole = detailConfigSchema.safeParse(kept);
  return whole.success ? { config: whole.data, version, dropped } : { config: {}, version, dropped: Object.keys(record) };
}
