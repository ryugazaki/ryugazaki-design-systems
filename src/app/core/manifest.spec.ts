import { isManifest, validateManifest } from './manifest';
import { validManifest } from './testing/fixtures';
import shared from '../../../scripts/lib/manifest-fixtures.json';

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

  it('validates palette and font entries', () => {
    const broken = { ...validManifest, palette: [42], fonts: [null] };
    const errors = validateManifest(broken);
    expect(errors).toContain('palette[0] needs token, light, dark, role');
    expect(errors).toContain('fonts[0] needs family, role, weights, googleFontsUrl');
    expect(isManifest(broken)).toBe(false);
  });

  it('validates allowed gradient entries', () => {
    const broken = { ...validManifest, allowedGradients: [{ pattern: 'linear-gradient' }] };
    expect(validateManifest(broken)).toContain('allowedGradients[0] needs pattern, reason');
  });

  it('accepts a missing allowedOrnaments and validates its entries when present', () => {
    expect(validateManifest(validManifest)).toEqual([]);
    const broken = { ...validManifest, allowedOrnaments: [{ pattern: 'glass-pane' }] };
    expect(validateManifest(broken)).toContain('allowedOrnaments[0] needs pattern, reason');
  });

  it('requires type scale step values to be strings', () => {
    const broken = { ...validManifest, typeScale: { ratio: 1.2, steps: { base: 16 } } };
    expect(validateManifest(broken)).toContain('typeScale.steps values must be strings');
  });

  describe('shared fixtures (parity with scripts/lib/systems-lib.mjs)', () => {
    it('accepts the shared valid manifest', () => {
      expect(validateManifest(shared.valid)).toEqual([]);
    });

    for (const c of shared.cases) {
      it(`reports exactly the expected errors: ${c.name}`, () => {
        const value = typeof c.patch === 'object' && c.patch !== null ? { ...shared.valid, ...c.patch } : c.patch;
        expect(validateManifest(value)).toEqual(c.expectedErrors);
      });
    }
  });
});
