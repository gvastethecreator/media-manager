import { emit, emitProgress, getEventStore } from '@/lib/server/events.server';

// Helpers para mockear fetch y window
const g: any = globalThis as any;
let originalFetch: any;
let originalWindow: any;

function mockFetch(recorder: { last: { url?: string; init?: RequestInit } }) {
	originalFetch = g.fetch;
	g.fetch = (url: any, init?: any) => {
		recorder.last = { url: String(url), init };
		return Promise.resolve(new Response(null, { status: 200 }));
	};
}

function restoreFetch() {
	g.fetch = originalFetch;
}

beforeEach(() => {
	// asegurar window está presente por jsdom (tests/setup.ts)
	originalWindow = g.window;
});

afterEach(() => {
	// restaurar window y fetch
	if (originalWindow !== undefined) {
		g.window = originalWindow;
	}
	if (originalFetch) {
		restoreFetch();
	}
});

describe('events.server emit (cliente)', () => {
	it('usa fetch POST /api/events con payload', async () => {
		const recorder: any = { last: {} };
		mockFetch(recorder);

		await emit({ type: 'images:modified', data: { ok: true } });

		expect(recorder.last.url).toBe('/api/events');
		expect(recorder.last.init?.method).toBe('POST');
		const body = JSON.parse(String(recorder.last.init?.body || '{}'));
		expect(body.type).toBe('images:modified');
		expect(body.data.ok).toBe(true);
	});

	it('emitProgress agrega timestamp', async () => {
		const recorder: any = { last: {} };
		mockFetch(recorder);

		await emitProgress('images:modified', {
			folderId: 'f1',
			status: 'processing',
			isProcessing: true,
			progress: 0,
			totalFiles: 0,
			filesProcessed: 0,
			message: 'x',
		} as any);

		const body = JSON.parse(String(recorder.last.init?.body || '{}'));
		expect(typeof body.data.timestamp).toBe('number');
	});
});

describe('events.server emit (servidor directo)', () => {
	it('almacena en eventStore cuando window es undefined', async () => {
		// simular entorno servidor sin usar delete
		const saved = g.window;
		g.window = undefined;

		const store = getEventStore();
		const beforeLen = store.get('files:modified')?.length ?? 0;

		await emit({ type: 'files:modified', data: { id: '1' } });

		const afterLen = store.get('files:modified')?.length ?? 0;
		expect(afterLen).toBe(beforeLen + 1);

		// restaurar jsdom window
		g.window = saved;
	});
});
