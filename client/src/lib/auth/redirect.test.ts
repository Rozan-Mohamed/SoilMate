import { describe, expect, it } from 'vitest';
import { DEFAULT_AUTH_REDIRECT, safeNextRoute } from './redirect';

describe('safeNextRoute', () => {
  it('keeps a same-site path, query and hash', () => {
    expect(safeNextRoute('/farm?step=2#crops')).toBe('/farm?step=2#crops');
  });

  it('falls back for missing or empty routes', () => {
    expect(safeNextRoute(undefined)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeNextRoute(null)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeNextRoute('   ')).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it('rejects absolute, protocol-relative and script URLs', () => {
    expect(safeNextRoute('https://evil.example/steal')).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeNextRoute('//evil.example/steal')).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeNextRoute('javascript:alert(1)')).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeNextRoute('farm')).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it('rejects a backslash-smuggled host', () => {
    expect(safeNextRoute('/\\evil.example/steal')).toBe(DEFAULT_AUTH_REDIRECT);
  });
});
