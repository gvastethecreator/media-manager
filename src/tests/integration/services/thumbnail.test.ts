import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { optimizeThumbnail } from '@/lib/thumbnails'

describe('thumbnail optimization', () => {
  it('optimizes a thumbnail buffer', async () => {
    const src = path.join(process.cwd(), 'public/avatars/01.png')
    const buffer = fs.readFileSync(src)
    const result = await optimizeThumbnail(buffer)
    expect(result.size).toBeGreaterThan(0)
    const meta = await sharp(result.data).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(result.width)
    expect(meta.height).toBe(result.height)
  })

  it('throws when sharp fails', async () => {
    jest.resetModules()
    jest.doMock('sharp', () => jest.fn(() => ({
      metadata: jest.fn().mockRejectedValue(new Error('fail')),
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn()
    })))
    const { optimizeThumbnail: opt } = await import('@/lib/thumbnails')
    const src = path.join(process.cwd(), 'public/avatars/01.png')
    const buffer = fs.readFileSync(src)
    await expect(opt(buffer)).rejects.toBeInstanceOf(Error)
    jest.resetModules()
  })
})
