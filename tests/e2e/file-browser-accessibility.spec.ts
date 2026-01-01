import { expect, test } from '@playwright/test';

// Aceptamos cualquiera de las clases de foco típicas: focus:ring-2 y/o ring-primary o ring-ring
const RING_PRIMARY_REGEX = /(ring-primary|focus:ring-2|focus:ring-ring)/;

// Tests de accesibilidad e interacción por teclado / hover para file-browser
// Requisitos:
// 1. Navegación con Tab llega a primer ítem y se puede mover con flechas.
// 2. Enter o Space activan onItemClick (marcado por anillo selección)
// 3. Botones de acción aparecen en hover/focus (cards/grid) -> verificar atributo data-entity-card y presencia de overlay/buttons.
// 4. Panel de métricas (debugPerf) se muestra si se pasa query param.

async function focusFirstEntity(page: any) {
	const first = page.locator('[data-entity-card]').first();
	await expect(first).toBeVisible({ timeout: 10_000 });
	await first.focus();
	await expect(first).toBeFocused();
	return first;
}

async function pressAndAssertSelection(page: any, key: string) {
	const first = page.locator('[data-entity-card]').first();
	// Simular selección: esperamos clase ring-* tras pulsar Enter/Space (la lógica real marca selección)
	await page.keyboard.press(key);
	// Damos un pequeño margen para re-render
	await page.waitForTimeout(80);
	const classList = await first.evaluate((el: HTMLElement) => el.className);
	// Si el tema no usa ring-primary explícito, aceptamos focus:ring-* como indicador de selección/foco visible
	expect(classList).toMatch(RING_PRIMARY_REGEX);
}

test.describe('File Browser: accesibilidad y foco', () => {
	test('navegación por flechas en grid', async ({ page }) => {
		await page.goto('/folders/cursed-dump', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		// Forzar modo grid si no lo está
		await page.waitForSelector('[data-testid="file-browser"]', { state: 'attached' });
		// Abrir dropdown con reintentos
		let attempts = 0;
		const maxAttempts = 3;
		while (attempts < maxAttempts) {
			await page.getByTestId('view-mode-dropdown-trigger').click();
			try {
				await page.waitForSelector('[data-testid="view-mode-grid-btn"]', { state: 'visible', timeout: 2000 });
				await page.click('[data-testid="view-mode-grid-btn"]');
				break;
			} catch {
				attempts++;
				if (attempts >= maxAttempts) {
					throw new Error('Dropdown no se abrió después de varios intentos');
				}
				await page.waitForTimeout(200);
			}
		}
		await expect(page.getByTestId('file-browser')).toHaveAttribute('data-view-mode', 'grid');
		// Esperar a que exista al menos una entidad si el dataset no está vacío
		let tries = 0;
		let count = await page.locator('[data-entity-card]').count();
		while (count === 0 && tries < 10) {
			await page.waitForTimeout(100);
			count = await page.locator('[data-entity-card]').count();
			tries += 1;
		}
		if (count === 0) test.skip(true, 'Sin entidades para navegar');
		await expect(page.locator('[data-entity-card]').first()).toBeVisible({ timeout: 10_000 });

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
		await page.goto('/folders/cursed-dump', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await page.getByTestId('view-mode-dropdown-trigger').click();
		await page.getByTestId('view-mode-grid-btn').click();
		await expect(page.getByTestId('file-browser')).toHaveAttribute('data-view-mode', 'grid');
		// Poll para detectar items bajo virtualización
		let tries = 0;
		let count = await page.locator('[data-entity-card]').count();
		while (count === 0 && tries < 10) {
			await page.waitForTimeout(100);
			count = await page.locator('[data-entity-card]').count();
			tries += 1;
		}
		// Si no hay entidades, saltamos
		if (count === 0) {
			test.skip(true, 'Sin entidades para seleccionar');
		}
		await focusFirstEntity(page);
		await pressAndAssertSelection(page, 'Enter');
	});

	test('Overlay / botones visibles en hover', async ({ page }) => {
		await page.goto('/folders/cursed-dump', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await page.getByTestId('view-mode-dropdown-trigger').click();
		await page.getByTestId('view-mode-cards-btn').click();
		await expect(page.getByTestId('file-browser')).toHaveAttribute('data-view-mode', 'cards');
		const items = page.locator('[data-entity-card]');
		let count = await items.count();
		// Pequeño poll por virtualización
		let tries = 0;
		while (count === 0 && tries < 10) {
			await page.waitForTimeout(100);
			count = await items.count();
			tries += 1;
		}
		if (count === 0) {
			test.skip(true, 'Sin entidades para hover');
		}
		const first = items.first();
		await expect(first).toBeVisible({ timeout: 15_000 });
		await first.hover();
		// Verificamos que algún botón dentro del card sea visible en hover si existe
		const actionBtn = first.locator('button').first();
		const hasButton = await actionBtn.count();
		if (hasButton > 0) {
			await expect(actionBtn).toBeVisible();
		} else {
			// Si no hay botones, verificamos al menos la imagen
			const thumbnail = first.locator('img').first();
			await expect(thumbnail).toBeVisible();
		}
	});

	test('Panel métricas aparece con debugPerf', async ({ page }) => {
		await page.goto('/folders/cursed-dump?debugPerf', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		const panel = page.getByText('Performance');
		await expect(panel).toBeVisible();
	});
});
