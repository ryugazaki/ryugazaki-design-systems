import { Manifest } from './models';

const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isText);

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
  if (!Array.isArray(m['allowedGradients'])) errors.push('allowedGradients must be an array');

  const scale = m['typeScale'] as Record<string, unknown> | undefined;
  if (!scale || typeof scale['ratio'] !== 'number' || typeof scale['steps'] !== 'object' || scale['steps'] === null) {
    errors.push('typeScale must have ratio and steps');
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
