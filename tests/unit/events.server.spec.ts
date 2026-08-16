import { emit, emitProgress, getEventStore, resolveEventTransport } from '@/lib/server/events.server';

// Helpers para mockear fetch
const g: any = globalThis as any;
let fetchWasMocked = false;
let originalFetch: typeof globalThis.fetch;
let originalWindowFetch: typeof globalThis.fetch | undefined;

function mockFetch(recorder: { last: { url?: string; init?: RequestInit } }, status = 200) {
	fetchWasMocked = true;
	originalFetch = g.fetch;
	originalWindowFetch = g.window?.fetch;
	const mockedFetch = (url: any, init?: any) => {
		recorder.last = { url: String(url), init };
		return Promise.resolve(new Response(null, { status, statusText: status === 200 ? 'OK' : 'Event failure' }));
	};
	g.fetch = mockedFetch;
	if (g.window) {
		g.window.fetch = mockedFetch;
	}
}

function restoreFetch() {
	g.fetch = originalFetch;
	if (g.window) {
		g.window.fetch = originalWindowFetch;
	}
}

beforeEach(() => {
	getEventStore().clear();
});

afterEach(() => {
	if (fetchWasMocked) {
		restoreFetch();
		fetchWasMocked = false;
	}
});

describe('events.server transport resolution', () => {
	it('resuelve auto a directo en servidor/tests y a HTTP en navegador', () => {
		expect(resolveEventTransport('auto', { hasWindow: false, isTest: false })).toBe('direct');
		expect(resolveEventTransport('auto', { hasWindow: true, isTest: true })).toBe('direct');
		expect(resolveEventTransport('auto', { hasWindow: true, isTest: false })).toBe('http');
		expect(resolveEventTransport('direct', { hasWindow: true, isTest: false })).toBe('direct');
	});
});

describe('events.server emit (cliente)', () => {
	it('usa fetch POST /api/events con payload', async () => {
		const recorder: any = { last: {} };
		mockFetch(recorder);

		await emit({ type: 'images:modified', data: { ok: true } }, 'http');

		expect(recorder.last.url).toBe('/api/events');
		expect(recorder.last.init?.method).toBe('POST');
		const body = JSON.parse(String(recorder.last.init?.body || '{}'));
		expect(body.type).toBe('images:modified');
		expect(body.data.ok).toBe(true);
	});

	it('emitProgress agrega timestamp', async () => {
		const recorder: any = { last: {} };
		mockFetch(recorder);

		await emitProgress(
			'images:modified',
			{
				folderId: 'f1',
				status: 'processing',
				isProcessing: true,
				progress: 0,
				totalFiles: 0,
				filesProcessed: 0,
				message: 'x',
			} as any,
			'http'
		);

		const body = JSON.parse(String(recorder.last.init?.body || '{}'));
		expect(typeof body.data.timestamp).toBe('number');
	});

	it('no propaga una respuesta HTTP fallida al flujo de dominio', async () => {
		const recorder: any = { last: {} };
		mockFetch(recorder, 500);

		await expect(emit({ type: 'images:modified', data: { ok: false } }, 'http')).resolves.toBeUndefined();
		expect(recorder.last.url).toBe('/api/events');
	});
});

describe('events.server emit (servidor directo)', () => {
	it('usa transporte directo por defecto en tests', async () => {
		const store = getEventStore();

		await emit({ type: 'files:modified', data: { id: '1' } });

		expect(store.get('files:modified')).toHaveLength(1);
	});

	it('elimina paths físicos y omite payloads pesados antes de almacenar', async () => {
		const privatePath = 'D:\\private\\secret.png';
		const heavyContent = 'x'.repeat(4096);

		await emit(
			{
				type: 'file:moved',
				data: {
					absolutePath: privatePath,
					content: heavyContent,
					message: `Movido desde ${privatePath}`,
					thumbnail: heavyContent,
				},
			},
			'direct'
		);

		const stored = getEventStore().get('file:moved')?.at(-1);
		expect(stored?.data).toEqual({
			content: '[omitted:4096 chars]',
			message: 'Movido desde [redacted-path]',
			thumbnail: '[omitted:4096 chars]',
		});
		expect(JSON.stringify(stored)).not.toContain(privatePath);
		expect(JSON.stringify(stored)).not.toContain(heavyContent);
	});
});
