import { formatDate, formatFileName, formatNumber, formatDuration } from '@/lib/format'

describe('format utilities', () => {
  beforeAll(() => {
    process.env.TZ = 'UTC'
  })

  it('formats dates in es-ES locale', () => {
    const date = new Date(Date.UTC(2024, 0, 5, 14, 30))
    const expected = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    expect(formatDate(date)).toBe(expected)
  })

  it('removes file extension', () => {
    expect(formatFileName('image.jpg')).toBe('image')
  })

  it('formats numbers with thousand separators', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('formats durations correctly', () => {
    expect(formatDuration(500)).toBe('500ms')
    expect(formatDuration(1500)).toBe('1s')
    expect(formatDuration(65000)).toBe('1m 5s')
    expect(formatDuration(3720000)).toBe('1h 2m')
  })
})
