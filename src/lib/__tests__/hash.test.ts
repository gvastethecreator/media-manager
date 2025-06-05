import fs from 'fs/promises';
import { computeTextHash, computeObjectHash, computeHash } from '../hash';

// 🔐 Tests para utilidades de hashing

describe('🔐 hash utilities', () => {
  it('genera hash de texto de forma consistente', () => {
    const h1 = computeTextHash('abc');
    const h2 = computeTextHash('abc');
    expect(h1).toBe(h2);
  });

  it('genera hash para objetos', () => {
    const h = computeObjectHash({ a: 1, b: 2 });
    expect(typeof h).toBe('string');
    expect(h).toBe(computeObjectHash({ a: 1, b: 2 }));
  });

  it('genera hash para archivos', async () => {
    const path = 'temp.txt';
    await fs.writeFile(path, 'hello');
    const hash = await computeHash(path);
    await fs.unlink(path);
    expect(hash).toBe(computeTextHash('hello'));
  });
});
