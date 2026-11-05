import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { check, frame, ref, text, ROOT } from './lib.mjs';

const doc = (children, variables = { 'color-ink': { type: 'color', value: [{ value: '#000', theme: { mode: 'dark' } }] } }) => ({
  version: '2.9', themes: { mode: ['dark', 'light'] }, variables, children,
});
const font = { 'font-display': { type: 'string', value: 'A' }, 'font-body': { type: 'string', value: 'B' } };

test('check accepts a valid component and instance', () => {
  const vars = { ...doc([]).variables, ...font };
  const comp = frame('btn', { reusable: true }, [text('btn-label', 'Go')]);
  assert.deepEqual(check(doc([comp, ref('use', 'btn', { descendants: { 'btn-label': { content: 'Stop' } } })], vars)), []);
});

test('check reports duplicate ids, broken refs, bad overrides, unknown variables and themes', () => {
  const vars = { ...font, 'color-x': { type: 'color', value: [{ value: '#fff', theme: { mode: 'sepia' } }] } };
  const comp = frame('btn', { reusable: true }, [text('btn-label', 'Go')]);
  const errors = check(doc([comp, frame('btn'), ref('a', 'nope'), ref('b', 'btn', { descendants: { ghost: {} } })], vars));
  assert.ok(errors.includes('duplicate id btn'));
  assert.ok(errors.includes('a refs nope, which is not a reusable node'));
  assert.ok(errors.includes('b overrides ghost, which is not inside btn'));
  assert.ok(errors.includes('unknown variable $color-ink'));
  assert.ok(errors.includes('color-x uses unknown theme mode:sepia'));
});

test('committed .pen files pass the check and match their manifests', async () => {
  for (const slug of ['glass-aurora', 'bauhaus-geometric', 'clay-playful']) {
    const pen = JSON.parse(await readFile(path.join(ROOT, 'design', `${slug}.pen`), 'utf8'));
    const manifest = JSON.parse(await readFile(path.join(ROOT, 'public', 'systems', slug, 'manifest.json'), 'utf8'));
    assert.deepEqual(check(pen), [], slug);
    for (const p of manifest.palette) {
      const values = pen.variables[p.token.slice(2)].value.map((v) => v.value);
      assert.deepEqual(values, [p.dark, p.light], `${slug} ${p.token} is out of date; run npm run build:pen`);
    }
  }
});
