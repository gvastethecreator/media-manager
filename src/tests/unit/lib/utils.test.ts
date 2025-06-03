import { formatBytes, getFileExtension, removeFileExtension, sanitizeFilename, generateSlug } from '@/lib/utils'

describe('utils', () => {
  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
    })

    it('returns 0 Bytes for invalid input', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(NaN as any)).toBe('0 Bytes')
    })
  })

  describe('getFileExtension', () => {
    it('returns the extension of a filename', () => {
      expect(getFileExtension('image.png')).toBe('png')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })
  })

  describe('removeFileExtension', () => {
    it('removes the extension from a filename', () => {
      expect(removeFileExtension('photo.jpg')).toBe('photo')
    })
  })

  describe('sanitizeFilename', () => {
    it('replaces invalid characters with underscores', () => {
      expect(sanitizeFilename('My File.jpg')).toBe('my_file_jpg')
    })
  })

  describe('generateSlug', () => {
    it('generates a URL friendly slug', () => {
      expect(generateSlug('Hello World!')).toBe('hello-world')
    })
  })
})
