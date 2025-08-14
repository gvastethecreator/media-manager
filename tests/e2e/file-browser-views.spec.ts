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
	const button = page.getByTestId(`view-mode-${mode}-btn`);
	await expect(button).toBeVisible();
	await expect(button).toBeEnabled();
	await button.click();
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
		await page.waitForSelector('[data-testid="view-mode-grid-btn"]', { state: 'visible' });

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
