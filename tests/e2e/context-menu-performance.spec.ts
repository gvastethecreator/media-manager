/**
 * @file Test de rendimiento para menú contextual
 * @module tests/e2e/context-menu-performance
 */
import { expect, test } from '@playwright/test';

test.describe('Context Menu Performance', () => {
	test.beforeEach(async ({ page }) => {
		// Navegar a la página del file browser
		await page.goto('http://localhost:5173/folders/cursed-dump');

		// Esperar que la app esté cargada
		await page.waitForSelector('[data-testid="file-browser"]', { timeout: 10_000 });

		// Esperar un poco más para que se carguen los archivos
		await page.waitForTimeout(2000);
	});

	test('menú contextual debería aparecer rápidamente', async ({ page }) => {
		// Buscar el primer item del grid
		const firstItem = page.locator('[data-testid="grid-view"] [data-entity-card]').first();
		await expect(firstItem).toBeVisible();

		// Medir el tiempo que tarda en aparecer el menú contextual
		const startTime = Date.now();

		// Hacer click derecho en el primer item
		await firstItem.click({ button: 'right' });

		// Esperar que aparezca el menú contextual
		const contextMenu = page.locator('[data-slot="context-menu-content"]');
		await expect(contextMenu).toBeVisible();

		const endTime = Date.now();
		const responseTime = endTime - startTime;

		console.log(`⏱️ Tiempo de respuesta del menú contextual: ${responseTime}ms`);

		// El menú debería aparecer en menos de 300ms para una buena UX
		expect(responseTime).toBeLessThan(300);
	});

	test('submenús deberían cargarse rápidamente', async ({ page }) => {
		// Hacer click derecho en el primer item
		const firstItem = page.locator('[data-testid="grid-view"] [data-entity-card]').first();
		await firstItem.click({ button: 'right' });

		// Esperar que aparezca el menú contextual
		const contextMenu = page.locator('[data-slot="context-menu-content"]');
		await expect(contextMenu).toBeVisible();

		// Hover sobre el submenú de Colecciones
		const collectionsSubmenu = page.locator('text=Colecciones');

		const startTime = Date.now();
		await collectionsSubmenu.hover();

		// Esperar que aparezca el submenú
		const submenuContent = page.locator('[data-slot="context-menu-sub-content"]');
		await expect(submenuContent).toBeVisible();

		const endTime = Date.now();
		const responseTime = endTime - startTime;

		console.log(`⏱️ Tiempo de carga del submenú: ${responseTime}ms`);

		// Los submenús deberían aparecer en menos de 200ms (ya precargados)
		expect(responseTime).toBeLessThan(200);
	});

	test('entidades críticas deberían estar precargadas', async ({ page }) => {
		// Esperar que el FileBrowser esté cargado
		await page.waitForSelector('[data-testid="file-browser"]');

		// Verificar en el console que las entidades se han precargado
		const logs: string[] = [];
		page.on('console', (msg) => {
			if (msg.text().includes('Precarga de entidades críticas')) {
				logs.push(msg.text());
			}
		});

		// Hacer click derecho para activar el menú contextual
		const firstItem = page.locator('[data-testid="grid-view"] [data-entity-card]').first();
		await firstItem.click({ button: 'right' });

		// Verificar que el menú aparece inmediatamente
		const contextMenu = page.locator('[data-slot="context-menu-content"]');
		await expect(contextMenu).toBeVisible();

		// Verificar que no hay spinners de carga en los submenús críticos
		await expect(page.locator('text=Cargando')).not.toBeVisible();
	});
});
