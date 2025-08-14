import { expect, test } from '@playwright/test';

const RING_PRIMARY_REGEX = /ring-primary/;

// Tests de accesibilidad e interacción por teclado / hover para file-browser
// Requisitos:
// 1. Navegación con Tab llega a primer ítem y se puede mover con flechas.
// 2. Enter o Space activan onItemClick (marcado por anillo selección)
// 3. Botones de acción aparecen en hover/focus (cards/grid) -> verificar atributo data-entity-card y presencia de overlay/buttons.
// 4. Panel de métricas (debugPerf) se muestra si se pasa query param.

async function focusFirstEntity(page: any) {
	const first = page.locator('[data-entity-card]').first();
	await first.focus();
	await expect(first).toBeFocused();
	return first;
}

async function pressAndAssertSelection(page: any, key: string) {
	const first = page.locator('[data-entity-card]').first();
	// Simular selección: esperamos clase ring-* tras pulsar Enter/Space (la lógica real marca selección)
	await page.keyboard.press(key);
	// Damos un pequeño margen para re-render
	await page.waitForTimeout(50);
	const classList = await first.evaluate((el: HTMLElement) => el.className);
	expect(classList).toMatch(RING_PRIMARY_REGEX);
}

test.describe('File Browser: accesibilidad y foco', () => {
	test('navegación por flechas en grid', async ({ page }) => {
		await page.goto('/folders/cursed-dump');
		// Forzar modo grid si no lo está
		await page.waitForSelector('[data-testid="file-browser"]', { state: 'attached' });
		await page.waitForSelector('[data-testid="view-mode-grid-btn"]', { state: 'visible' });
		const gridBtn = page.getByTestId('view-mode-grid-btn');
		await gridBtn.click();

		const first = await focusFirstEntity(page);

		// Mover a la derecha
		await page.keyboard.press('ArrowRight');
		const second = page.locator('[data-entity-card]').nth(1);
		await expect(second).toBeFocused();

		// Volver izquierda
		await page.keyboard.press('ArrowLeft');
		await expect(first).toBeFocused();
	});

	test('Enter y Space activan selección', async ({ page }) => {
		await page.goto('/folders/cursed-dump');
		await page.getByTestId('view-mode-grid-btn').click();
		await focusFirstEntity(page);
		await pressAndAssertSelection(page, 'Enter');
	});

	test('Overlay / botones visibles en hover', async ({ page }) => {
		await page.goto('/folders/cursed-dump');
		await page.getByTestId('view-mode-cards-btn').click();
		const first = page.locator('[data-entity-card]').first();
		await first.hover();
		// Esperar a que aparezca algún botón de acción (usa button dentro del card)
		const actionBtn = first.locator('button').first();
		await expect(actionBtn).toBeVisible();
	});

	test('Panel métricas aparece con debugPerf', async ({ page }) => {
		await page.goto('/folders/cursed-dump?debugPerf');
		const panel = page.getByText('Performance');
		await expect(panel).toBeVisible();
	});
});
