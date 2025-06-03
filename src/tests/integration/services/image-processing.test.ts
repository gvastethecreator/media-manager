import fs from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'

jest.mock('uuid', () => ({ v4: () => 'test-id' }))

describe('image processing integration', () => {
  it('processes and saves image to disk', async () => {
    jest.resetModules()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'img-'))
    process.env.UPLOADS_DIR = tmpDir
    const { processImage } = await import('@/lib/image-processing')
    const src = path.join(process.cwd(), 'public/avatars/01.png')
    const { path: outPath, metadata } = await processImage(src, { width: 50, height: 50, format: 'webp' })

    expect(fs.existsSync(outPath)).toBe(true)
    const outMeta = await sharp(outPath).metadata()
    expect(outMeta.width).toBe(50)
    expect(outMeta.height).toBe(50)
    expect(metadata.format).toBe('webp')

    fs.rmSync(outPath)
    fs.rmdirSync(tmpDir, { recursive: true })
  })

  it('supports different output formats', async () => {
    jest.resetModules()
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'img-'))
    process.env.UPLOADS_DIR = tmpDir
    const { processImage } = await import('@/lib/image-processing')
    const src = path.join(process.cwd(), 'public/avatars/01.png')
    const { path: outPath } = await processImage(src, { width: 20, format: 'png' })
    const meta = await sharp(outPath).metadata()
    expect(meta.format).toBe('png')
    fs.rmSync(outPath)
    fs.rmdirSync(tmpDir, { recursive: true })
  })

  it('retrieves image dimensions and metadata', async () => {
    jest.resetModules()
    const { getImageDimensions, getImageMetadata } = await import('@/lib/image-processing')
    const src = path.join(process.cwd(), 'public/avatars/01.png')
    const dims = await getImageDimensions(src)
    expect(dims.width).toBeGreaterThan(0)
    expect(dims.height).toBeGreaterThan(0)
    const meta = await getImageMetadata(src)
    expect(meta.originalName).toBe('01.png')
    expect(meta.mimeType).toBe('image/png')
  })

  it('throws error on invalid path', async () => {
    jest.resetModules()
    const { getImageDimensions } = await import('@/lib/image-processing')
    await expect(getImageDimensions('/invalid.png')).rejects.toBeInstanceOf(Error)
  })
})
