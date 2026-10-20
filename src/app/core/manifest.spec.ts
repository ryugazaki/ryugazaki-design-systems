import { isManifest, validateManifest } from './manifest';
import { validManifest } from './testing/fixtures';

describe('validateManifest', () => {
  it('accepts a complete manifest', () => {
    expect(validateManifest(validManifest)).toEqual([]);
    expect(isManifest(validManifest)).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(validateManifest(null)).toEqual(['manifest is not an object']);
  });

  it('reports each missing or malformed field', () => {
    const broken = { ...validManifest, name: '', defaultMode: 'sepia', components: [{ id: 'x' }] };
    const errors = validateManifest(broken);
    expect(errors).toContain('name must be a non-empty string');
    expect(errors).toContain('defaultMode must be "light" or "dark"');
    expect(errors).toContain('components[0] needs id, name, file, notes');
    expect(isManifest(broken)).toBe(false);
  });
});
