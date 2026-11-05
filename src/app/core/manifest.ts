import { Manifest } from './models';

const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isText);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Pushes `${key}[i] needs ${fields}` for every entry that is not an object or fails `ok`. No-op when list is not an array. */
function checkEntries(
  list: unknown,
  key: string,
  errors: string[],
  fields: string,
  ok: (entry: Record<string, unknown>) => boolean,
): void {
  if (!Array.isArray(list)) return;
  list.forEach((entry, i) => {
    if (!isRecord(entry) || !ok(entry)) errors.push(`${key}[${i}] needs ${fields}`);
  });
}

/** Returns a list of human-readable problems; empty means valid. Mirrors scripts/lib/systems-lib.mjs. */
export function validateManifest(value: unknown): string[] {
  if (typeof value !== 'object' || value === null) return ['manifest is not an object'];
  const m = value as Record<string, unknown>;
  const errors: string[] = [];

  for (const key of ['slug', 'name', 'tagline', 'description']) {
    if (!isText(m[key])) errors.push(`${key} must be a non-empty string`);
  }
  if (typeof m['number'] !== 'number') errors.push('number must be a number');
  for (const key of ['tags', 'useCases']) {
    if (!isTextList(m[key])) errors.push(`${key} must be a string array`);
  }
  if (m['defaultMode'] !== 'light' && m['defaultMode'] !== 'dark') {
    errors.push('defaultMode must be "light" or "dark"');
  }
  for (const key of ['fonts', 'palette']) {
    const list = m[key];
    if (!Array.isArray(list) || list.length === 0) errors.push(`${key} must be a non-empty array`);
  }
  checkEntries(m['fonts'], 'fonts', errors, 'family, role, weights, googleFontsUrl', (f) =>
    isText(f['family']) && isText(f['role']) && isText(f['googleFontsUrl']) &&
    Array.isArray(f['weights']) && f['weights'].every((w) => typeof w === 'number'),
  );
  checkEntries(m['palette'], 'palette', errors, 'token, light, dark, role', (p) =>
    isText(p['token']) && isText(p['light']) && isText(p['dark']) && isText(p['role']),
  );
  if (!Array.isArray(m['allowedGradients'])) errors.push('allowedGradients must be an array');
  checkEntries(m['allowedGradients'], 'allowedGradients', errors, 'pattern, reason', (g) =>
    isText(g['pattern']) && isText(g['reason']),
  );
  if (m['allowedOrnaments'] !== undefined && !Array.isArray(m['allowedOrnaments'])) {
    errors.push('allowedOrnaments must be an array when present');
  }
  checkEntries(m['allowedOrnaments'], 'allowedOrnaments', errors, 'pattern, reason', (o) =>
    isText(o['pattern']) && isText(o['reason']),
  );

  const scale = m['typeScale'] as Record<string, unknown> | undefined;
  if (!scale || typeof scale['ratio'] !== 'number' || typeof scale['steps'] !== 'object' || scale['steps'] === null) {
    errors.push('typeScale must have ratio and steps');
  } else if (Array.isArray(scale['steps']) || !Object.values(scale['steps']).every(isText)) {
    errors.push('typeScale.steps values must be strings');
  }
  const rules = m['rules'] as Record<string, unknown> | undefined;
  if (!rules || !isTextList(rules['do']) || !isTextList(rules['dont'])) {
    errors.push('rules must have do and dont string arrays');
  }

  for (const key of ['components', 'pages']) {
    const list = m[key];
    if (!Array.isArray(list)) {
      errors.push(`${key} must be an array`);
      continue;
    }
    list.forEach((raw, i) => {
      const item = (raw ?? {}) as Record<string, unknown>;
      const needsNotes = key === 'components';
      const ok = isText(item['id']) && isText(item['name']) && isText(item['file']) && (!needsNotes || isText(item['notes']));
      if (!ok) errors.push(`${key}[${i}] needs id, name, file${needsNotes ? ', notes' : ''}`);
    });
  }
  return errors;
}

export function isManifest(value: unknown): value is Manifest {
  return validateManifest(value).length === 0;
}
