import { throttleEvent } from '../event-throttler';

// 🧪 Pruebas para el helper de eventos con throttling

describe('🚦 throttleEvent', () => {
  it('controla múltiples llamadas y resuelve una vez', async () => {
    jest.useFakeTimers();
    const fn = jest.fn().mockResolvedValue('done');
    const throttled = throttleEvent(fn, 'test', { delay: 100 });

    const p1 = throttled('a');
    const p2 = throttled('b');

    jest.advanceTimersByTime(100);
    await expect(p1).resolves.toBe('done');
    await expect(p2).resolves.toBe('done');
    expect(fn).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
