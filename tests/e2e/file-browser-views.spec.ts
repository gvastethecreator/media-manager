import { expect, test } from '@playwright/test';

// Objetivo: validar scroll e interactividad en todas las vistas del file-browser
// Ruta base: /folders/cursed-dump (seed existente)
// Selector toolbar: botones con [data-testid="view-mode-<mode>-btn"]
// Vistas y testids: grid-view, cards-view, masonry-view, listview-container

function getViewport(page: any) {
	// El ScrollArea en FileBrowser se monta con data-testid="file-browser-scroll-area"
	// El viewport hereda sufijo -viewport => file-browser-scroll-area-viewport
	return page.getByTestId('file-browser-scroll-area-viewport');
}

async function assertScrollable(page: any) {
	const { clientHeight, scrollHeight } = await getViewport(page).evaluate((el: HTMLElement) => ({
		clientHeight: el.clientHeight,
		scrollHeight: el.scrollHeight,
	}));
	expect(scrollHeight).toBeGreaterThan(clientHeight);
}

async function clickFirstItem(page: any, view: 'grid' | 'cards' | 'masonry' | 'list') {
	if (view === 'list') {
		// Fila 0
		const firstRow = page.getByTestId('listview-container').locator('[data-testid^="list-row-"]').first();
		await expect(firstRow).toBeVisible();
		await firstRow.click();
		return;
	}
	// Para grid/cards/masonry, usamos el primer entity-card visible
	const firstCard = page.locator('[data-entity-card]').first();
	await expect(firstCard).toBeVisible();
	await firstCard.click();
}

async function switchView(page: any, mode: 'grid' | 'cards' | 'masonry' | 'list') {
	const trigger = page.getByTestId('view-mode-dropdown-trigger');
	await expect(trigger).toBeVisible();
	await trigger.click();
	const item = page.getByTestId(`view-mode-${mode}-btn`);
	await expect(item).toBeVisible();
	await item.click();
}

function viewLocatorFor(mode: 'grid' | 'cards' | 'masonry' | 'list') {
	switch (mode) {
		case 'grid':
			return '[data-testid="grid-view"]';
		case 'cards':
			return '[data-testid="cards-view"]';
		case 'masonry':
			return '[data-testid="masonry-view"]';
		case 'list':
			return '[data-testid="listview-container"]';
		default:
			return '[data-testid="grid-view"]';
	}
}

test.describe('File Browser: vistas con scroll e interacción', () => {
	test('grid, cards, masonry y list funcionan tras alternar desde toolbar', async ({ page }) => {
		await page.goto('/folders/cursed-dump');

		// Asegurar que la vista inicial renderizó algo (cualquiera)
		await expect(getViewport(page)).toBeVisible();
		await page.waitForSelector('[data-testid="file-browser"]', { state: 'attached' });
		await page.waitForSelector('[data-testid="view-mode-dropdown-trigger"]', { state: 'visible' });

		const modes: Array<'grid' | 'cards' | 'masonry' | 'list'> = ['grid', 'cards', 'masonry', 'list'];

		// Ejecutar secuencialmente sin await dentro de bucles
		await modes.reduce(async (prev, mode) => {
			await prev;
			await switchView(page, mode);
			const viewSel = viewLocatorFor(mode);
			await expect(page.locator(viewSel)).toBeVisible();
			await assertScrollable(page);
			await clickFirstItem(page, mode);
		}, Promise.resolve());
	});
});

/**
 * Tests específicos para thumbnails de video WebP animados
 */
test.describe('Video Thumbnails WebP Animados', () => {
	const API_BASE = 'http://localhost:4000';

	test.beforeEach(async ({ page }) => {
		await page.goto('/folders/cursed-dump');
		await page.waitForSelector('[data-testid="file-browser"]', { timeout: 10_000 });
		await page.waitForTimeout(1000);
	});

	test('thumbnails de video se muestran en grid view', async ({ page }) => {
		// Cambiar a vista grid
		await switchView(page, 'grid');

		// Buscar tarjetas de video
		const videoCards = page.locator('[data-entity-card][data-entity-type="video"]');
		const videoCount = await videoCards.count();

		if (videoCount === 0) {
			console.log('⚠️ No se encontraron videos para probar thumbnails');
			return;
		}

		const firstVideo = videoCards.first();
		await expect(firstVideo).toBeVisible();

		// Verificar que el thumbnail existe y está visible
		const thumbnailImg = firstVideo.locator('img').first();
		await expect(thumbnailImg).toBeVisible();

		// Verificar que tiene src válida
		const thumbnailSrc = await thumbnailImg.getAttribute('src');
		expect(thumbnailSrc).toBeTruthy();
		expect(thumbnailSrc).toMatch(/\/videos\/[^/]+\/thumbnail/);

		console.log('🎬 Video thumbnail URL:', thumbnailSrc);
	});

	test('API devuelve thumbnails WebP animados', async ({ page }) => {
		// Obtener lista de videos
		const videosResponse = await page.request.get(`${API_BASE}/videos`);
		expect(videosResponse.ok()).toBeTruthy();

		const videos = await videosResponse.json();
		if (!videos || videos.length === 0) {
			console.log('⚠️ No hay videos en la base de datos');
			return;
		}

		const firstVideo = videos[0];
		console.log('🎬 Testing video:', firstVideo.name);

		// Probar endpoint de thumbnail
		const thumbnailResponse = await page.request.get(`${API_BASE}/videos/${firstVideo.id}/thumbnail`);
		expect(thumbnailResponse.ok()).toBeTruthy();

		// Verificar content-type WebP
		const contentType = thumbnailResponse.headers()['content-type'];
		expect(contentType).toBe('image/webp');

		// Verificar tamaño del archivo
		const buffer = await thumbnailResponse.body();
		expect(buffer.length).toBeGreaterThan(0);

		console.log('✅ WebP animado generado:', buffer.length, 'bytes');
	});

	test('thumbnails cargan sin errores en diferentes vistas', async ({ page }) => {
		const views = ['grid', 'cards', 'masonry'] as const;
		const networkErrors: string[] = [];

		// Capturar errores de red para thumbnails
		page.on('response', (response) => {
			if (response.url().includes('/videos/') && response.url().includes('/thumbnail') && !response.ok()) {
				networkErrors.push(`${response.status()} - ${response.url()}`);
			}
		});

		for (const view of views) {
			console.log(`🔄 Probando thumbnails en vista: ${view}`);

			await switchView(page, view);
			await page.waitForTimeout(500);

			const videoCards = page.locator('[data-entity-card][data-entity-type="video"]');
			const count = await videoCards.count();

			if (count > 0) {
				// Verificar que los thumbnails están visibles
				const firstVideoThumbnail = videoCards.first().locator('img').first();
				await expect(firstVideoThumbnail).toBeVisible();
				console.log(`✅ Thumbnails visibles en ${view}: ${count} videos`);
			}
		}

		// Verificar que no hubo errores de red
		expect(networkErrors).toHaveLength(0);
		if (networkErrors.length > 0) {
			console.error('❌ Errores de red en thumbnails:', networkErrors);
		} else {
			console.log('✅ Todos los thumbnails cargaron sin errores');
		}
	});

	test('performance de carga de thumbnails', async ({ page }) => {
		// Cambiar a grid view para mejor visibilidad
		await switchView(page, 'grid');

		const startTime = Date.now();

		// Recargar página para medir tiempo de carga inicial
		await page.reload();
		await page.waitForSelector('[data-testid="file-browser"]', { timeout: 10_000 });

		// Esperar a que los thumbnails de video estén cargados
		const videoCards = page.locator('[data-entity-card][data-entity-type="video"]');
		const videoCount = await videoCards.count();

		if (videoCount > 0) {
			// Esperar a que el primer thumbnail esté visible
			const firstThumbnail = videoCards.first().locator('img').first();
			await expect(firstThumbnail).toBeVisible();

			const loadTime = Date.now() - startTime;
			console.log(`⏱️ Tiempo de carga de thumbnails: ${loadTime}ms`);

			// Los thumbnails deberían cargar en menos de 3 segundos
			expect(loadTime).toBeLessThan(3000);
		}
	});
});
