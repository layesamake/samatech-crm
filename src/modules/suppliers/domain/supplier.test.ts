import { describe, expect, it } from 'vitest';
import { normalizeSupplierName, SupplierInputSchema } from './supplier';

describe('supplier domain', () => {
  it('normalise les noms sans tenir compte des accents', () => {
    expect(normalizeSupplierName('  Éts SÉNÉGAL  ')).toBe('ets senegal');
  });
  it('exige un nom', () => {
    expect(() => SupplierInputSchema.parse({ name: '', kind: 'SUPPLIER' })).toThrow();
  });
});
