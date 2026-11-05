import { CONTENT_SCHEMA_VERSION } from './content-contract';
import { customQuestionSchema, detailConfigSchema, registrationFormReadSchema, type DetailConfig } from './detail-config';

export type NormalizedConfig = { config: DetailConfig; version: number; dropped: string[] };
type RegistrationForm = NonNullable<DetailConfig['registrationForm']>;

/**
 * S18-Q4 / D-035: the registration form is the one section whose rules reach across items (unique ids, a condition naming
 * another question), so one question an older version or a hand edit left inconsistent used to take the whole form off the
 * page, every question column out of the export and every question out of the editor. Read it question by question
 * instead: a question that does not parse, or repeats an id (the first one stays), is left out, because no reader could
 * ever show it; a condition naming a missing question stays, because D-034 already treats that question as never applying
 * and its stored answers belong in the export. `removed` counts the left-out questions; `undefined` = not readable at all.
 */
function readRegistrationForm(value: unknown): { form: RegistrationForm; removed: number } | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.customQuestions)) return undefined;
  const ids = new Set<string>();
  const questions = raw.customQuestions.flatMap((item) => {
    const parsed = customQuestionSchema.safeParse(item);
    if (!parsed.success || ids.has(parsed.data.id)) return [];
    ids.add(parsed.data.id);
    return [parsed.data];
  });
  const parsed = registrationFormReadSchema.safeParse({ ...raw, customQuestions: questions });
  return parsed.success ? { form: parsed.data, removed: raw.customQuestions.length - questions.length } : undefined;
}

/**
 * Read path for stored configs. The strict schema stays on the write path; reading is lenient per section, so a
 * config written by an older version (or containing a section today's rules reject) loses only that section instead
 * of rendering as an empty invitation. `dropped` names the removed top-level keys (never their values) for logging;
 * `registrationForm.customQuestions` means the form was kept with some unreadable questions left out.
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
  let readForm: RegistrationForm | undefined;
  for (const [key, value] of Object.entries(record)) {
    if (key === 'schemaVersion') continue;
    const parsed = shape[key]?.safeParse(value);
    if (parsed?.success) {
      kept[key] = parsed.data;
      continue;
    }
    const read = key === 'registrationForm' ? readRegistrationForm(value) : undefined;
    if (read) {
      readForm = read.form;
      if (read.removed) dropped.push('registrationForm.customQuestions');
    } else dropped.push(key);
  }
  // A form kept by the read rules may name a missing question, which the strict whole would refuse; it joins afterwards.
  const whole = detailConfigSchema.safeParse(kept);
  if (!whole.success) return { config: {}, version, dropped: Object.keys(record) };
  return { config: readForm ? { ...whole.data, registrationForm: readForm } : whole.data, version, dropped };
}

/**
 * The write path's half of S18-Q4 / D-035: a save that does not touch the registration form carries the stored form as
 * every reader already sees it, so a condition naming a deleted question cannot block saving another section and is
 * never silently rewritten into a different form. `undefined` = nothing to carry: the stored form passes the strict rules
 * (or is absent), or not even the read rules accept it, in which case the strict parse refuses the save as before.
 */
export function carriedRegistrationForm(raw: unknown): { rest: Record<string, unknown>; form: RegistrationForm } | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const { registrationForm, ...rest } = raw as Record<string, unknown>;
  if (registrationForm === undefined || detailConfigSchema.shape.registrationForm.safeParse(registrationForm).success) return undefined;
  const read = readRegistrationForm(registrationForm);
  return read ? { rest, form: read.form } : undefined;
}
