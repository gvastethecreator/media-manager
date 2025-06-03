import fs from 'fs'
import os from 'os'
import path from 'path'
import { computeHash, computeTextHash, computeObjectHash } from '@/lib/hash'

describe('hash utilities', () => {
  it('computes text hash consistently', () => {
    const hash1 = computeTextHash('test')
    const hash2 = computeTextHash('test')
    expect(hash1).toBe(hash2)
  })

  it('computes object hash from JSON string', () => {
    const obj = { a: 1, b: 'two' }
    const expected = computeTextHash(JSON.stringify(obj))
    expect(computeObjectHash(obj)).toBe(expected)
  })

  it('computes file hash equal to text hash', async () => {
    const tmp = path.join(os.tmpdir(), 'hash-test.txt')
    fs.writeFileSync(tmp, 'hello')
    const fileHash = await computeHash(tmp)
    const expected = computeTextHash('hello')
    expect(fileHash).toBe(expected)
    fs.unlinkSync(tmp)
  })

  it('rejects when file does not exist', async () => {
    await expect(computeHash('/invalid/path')).rejects.toBeInstanceOf(Error)
  })
})
