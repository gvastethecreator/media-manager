import { CacheManager } from '@/lib/cache'

describe('CacheManager', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('sets and gets values', async () => {
    const cache = new CacheManager<number>({ ttl: 1000 })
    await cache.set('a', 1)
    jest.advanceTimersByTime(500)
    await expect(cache.get('a')).resolves.toBe(1)
  })

  it('expires items after ttl', async () => {
    const cache = new CacheManager<number>({ ttl: 1000 })
    await cache.set('a', 1)
    jest.advanceTimersByTime(1500)
    await expect(cache.get('a')).resolves.toBeUndefined()
  })

  it('allows stale values when configured', async () => {
    const cache = new CacheManager<number>({ ttl: 1000, allowStale: true })
    await cache.set('a', 1)
    jest.advanceTimersByTime(1500)
    await expect(cache.get('a')).resolves.toBe(1)
  })

  it('updates age on get when updateAgeOnGet is true', async () => {
    const cache = new CacheManager<number>({ ttl: 1000, updateAgeOnGet: true })
    await cache.set('a', 1)
    jest.advanceTimersByTime(800)
    await cache.get('a')
    jest.advanceTimersByTime(800)
    await expect(cache.get('a')).resolves.toBe(1)
  })

  it('evicts oldest when max size exceeded', async () => {
    const cache = new CacheManager<number>({ maxSize: 2, ttl: 1000 })
    await cache.set('a', 1)
    jest.advanceTimersByTime(10)
    await cache.set('b', 2)
    jest.advanceTimersByTime(10)
    await cache.set('c', 3)
    await expect(cache.get('a')).resolves.toBeUndefined()
    await expect(cache.get('b')).resolves.toBe(2)
    await expect(cache.get('c')).resolves.toBe(3)
  })
})
