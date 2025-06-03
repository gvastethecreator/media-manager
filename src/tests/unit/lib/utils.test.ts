import { formatBytes, getFileExtension, removeFileExtension, sanitizeFilename, generateSlug, slugify, truncate, formatDate as utilFormatDate, debounce, throttle } from '@/lib/utils'

describe('utils helpers', () => {
  it('formats bytes to readable string', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('extracts and removes file extensions', () => {
    expect(getFileExtension('photo.jpeg')).toBe('jpeg')
    expect(removeFileExtension('photo.jpeg')).toBe('photo')
  })

  it('sanitizes filenames and generates slug', () => {
    expect(sanitizeFilename('Te!st File.JPG')).toBe('te_st_file_jpg')
    expect(generateSlug('Hola Mundo!')).toBe('hola-mundo')
    expect(slugify('Árbol de Navidad')).toBe('arbol-de-navidad')
  })

  it('formats bytes edge cases', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(-1)).toBe('NaN undefined')
  })

  it('formatDate returns N/A for undefined', () => {
    expect(utilFormatDate(undefined)).toBe('N/A')
  })

  it('truncate returns original when shorter', () => {
    expect(truncate('short', 10)).toBe('short')
    expect(truncate('this is long text', 4)).toBe('this...')
  })

  it('debounce delays execution', () => {
    jest.useFakeTimers()
    const fn = jest.fn()
    const debounced = debounce(fn, 200)
    debounced()
    debounced()
    jest.advanceTimersByTime(199)
    expect(fn).not.toBeCalled()
    jest.advanceTimersByTime(1)
    expect(fn).toBeCalledTimes(1)
    jest.useRealTimers()
  })

  it('throttle limits execution frequency', () => {
    jest.useFakeTimers()
    const fn = jest.fn()
    const throttled = throttle(fn, 200)
    throttled()
    throttled()
    jest.advanceTimersByTime(199)
    throttled()
    expect(fn).toBeCalledTimes(1)
    jest.advanceTimersByTime(1)
    throttled()
    expect(fn).toBeCalledTimes(2)
    jest.useRealTimers()
  })
})
