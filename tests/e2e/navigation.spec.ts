import { expect, test } from '@playwright/test';

// Tests para verificar la funcionalidad de navegación

test.describe('Navegación', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
		await page.waitForTimeout(2000); // Esperar a que la página cargue completamente
	});

	test('verifica que la página principal carga', async ({ page }) => {
		// Verificar que la página carga
		await expect(page).toHaveTitle(/Sistema de Gestión de Imágenes/);

		// Tomar screenshot para debug
		await page.screenshot({ path: 'debug-main-page.png', fullPage: true });
	});

	test('verifica que el panel de navegación esté presente', async ({ page }) => {
		// Buscar el panel de navegación
		const navigationPanel = page.locator('[data-testid="navigation-panel"], .navigation-panel, nav');

		// Si no encuentra por data-testid, buscar por contenido
		if ((await navigationPanel.count()) === 0) {
			// Buscar por texto de categorías
			const foldersText = page.locator('text=Carpetas');
			await expect(foldersText).toBeVisible({ timeout: 10000 });
		} else {
			await expect(navigationPanel.first()).toBeVisible();
		}

		// Tomar screenshot para debug
		await page.screenshot({ path: 'debug-navigation-panel.png', fullPage: true });
	});

	test('verifica que las carpetas estén visibles', async ({ page }) => {
		// Esperar y verificar que las carpetas estén visibles
		await page.waitForSelector('text=Cartoons', { timeout: 10000 });
		await page.waitForSelector('text=Wallpapers', { timeout: 10000 });
		await page.waitForSelector('text=Photography', { timeout: 10000 });
		await page.waitForSelector('text=Memes', { timeout: 10000 });

		// Verificar que estén visibles
		await expect(page.locator('text=Cartoons')).toBeVisible();
		await expect(page.locator('text=Wallpapers')).toBeVisible();
		await expect(page.locator('text=Photography')).toBeVisible();
		await expect(page.locator('text=Memes')).toBeVisible();

		// Tomar screenshot para debug
		await page.screenshot({ path: 'debug-folders-visible.png', fullPage: true });
	});

	test('verifica que los elementos sean clickeables', async ({ page }) => {
		// Esperar a que Cartoons esté visible
		await page.waitForSelector('text=Cartoons', { timeout: 10000 });

		// Buscar el elemento clickeable de Cartoons
		const cartoonsElement = page.locator('text=Cartoons').first();
		await expect(cartoonsElement).toBeVisible();

		// Verificar que sea clickeable
		await expect(cartoonsElement).toBeEnabled();

		// Hacer click
		await cartoonsElement.click();
		await page.waitForTimeout(1000);

		// Tomar screenshot después del click
		await page.screenshot({ path: 'debug-after-click.png', fullPage: true });
	});

	test('verifica la estructura del DOM de navegación', async ({ page }) => {
		// Buscar elementos de navegación por diferentes selectores
		const navigationElements = await page
			.locator('button, a, [role="button"]')
			.filter({ hasText: /Cartoons|Wallpapers|Photography|Memes/ })
			.count();

		console.log(`Encontrados ${navigationElements} elementos de navegación`);

		// Verificar que hay al menos algunos elementos
		expect(navigationElements).toBeGreaterThan(0);

		// Listar todos los elementos con texto relevante
		const allElements = page.locator('*').filter({ hasText: /Cartoons|Wallpapers|Photography|Memes|Carpetas/ });
		const count = await allElements.count();

		for (let i = 0; i < Math.min(count, 10); i++) {
			const element = allElements.nth(i);
			const text = await element.textContent();
			const tagName = await element.evaluate((el) => el.tagName);
			console.log(`Elemento ${i}: ${tagName} - ${text}`);
		}

		// Tomar screenshot para debug
		await page.screenshot({ path: 'debug-dom-structure.png', fullPage: true });
	});
});
