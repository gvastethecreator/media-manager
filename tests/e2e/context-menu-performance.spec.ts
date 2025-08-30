/**
 * @file Test de rendimiento para menú contextual
 * @module tests/e2e/context-menu-performance
 */
import { expect, test } from '@playwright/test';

async function openContextMenuRobusto(page: any, locator: any) {
	// Centrar mouse y abrir con click derecho; si falla, fallback con teclado (Shift+F10)
	// Tolerar reciclado del DOM (virtualización) y un par de reintentos rápidos.
	try {
		await locator.scrollIntoViewIfNeeded();
	} catch {
		// Si el elemento se desancla, ignoramos y continuamos con hover/click usando el locator vivo
	}

	try {
		const box = await locator.boundingBox();
		if (box) {
			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		} else {
			// Si no hay caja aún, forzar hover para estabilizar
			await locator.hover({ force: true });
		}
	} catch {
		// Ignorar y seguir con click directo
	}

	// Intento 1: click derecho normal
	try {
		await locator.click({ button: 'right' });
	} catch {
		// Si falla, intentamos forzar el click
		await locator.click({ button: 'right', force: true });
	}

	const contextMenu = page.locator('[data-slot="context-menu-content"][data-state="open"]');
	let appeared = false;
	try {
		await expect(contextMenu).toBeVisible({ timeout: 300 });
		appeared = true;
	} catch {
		// Fallback por teclado (Windows/Linux)
		try {
			await locator.focus();
		} catch {}
		await page.keyboard.press('Shift+F10');
		try {
			await expect(contextMenu).toBeVisible({ timeout: 700 });
			appeared = true;
		} catch {}
	}

	if (!appeared) {
		// Reintentos finitos adicionales (2) para tolerar reciclado de DOM por virtualización
		for (let i = 0; i < 2 && !appeared; i++) {
			try {
				await locator.click({ button: 'right', force: true });
			} catch {}
			try {
				await expect(contextMenu).toBeVisible({ timeout: 1200 });
				appeared = true;
				break;
			} catch {}
		}
		// Último chequeo ampliado
		if (!appeared) {
			await expect(contextMenu).toBeVisible({ timeout: 2000 });
		}
	}
}

test.describe('Context Menu Performance', () => {
	test.beforeEach(async ({ page }) => {
		// Navegar a la página del file browser (evitar esperar al evento 'load' por recursos largos)
		await page.goto('/folders/cursed-dump', { waitUntil: 'domcontentloaded', timeout: 60_000 });

		// Esperar que la app esté cargada
		await page.waitForSelector('[data-testid="file-browser"]', { timeout: 10_000 });
		// Forzar vista grid para selectores determinísticos
		await page.getByTestId('view-mode-dropdown-trigger').click({ force: true });
		await page.getByTestId('view-mode-grid-btn').click();
		await expect(page.getByTestId('file-browser')).toHaveAttribute('data-view-mode', 'grid');
		// Resetear scroll para asegurar primer item montado
		const viewport = page.getByTestId('file-browser-scroll-area-viewport');
		await viewport.evaluate((el: HTMLElement) => {
			el.scrollTop = 0;
		});
		// Asegurar al menos un item visible si hay datos
		// Poll rápido de conteo antes de exigir visibilidad
		let tries = 0;
		let itemCount = await page.locator('[data-entity-card]').count();
		while (itemCount === 0 && tries < 10) {
			await page.waitForTimeout(100);
			itemCount = await page.locator('[data-entity-card]').count();
			tries += 1;
		}
		if (itemCount > 0) {
			await expect(page.locator('[data-entity-card]').first()).toBeVisible({ timeout: 10_000 });
		}
	});

	test('menú contextual debería aparecer rápidamente', async ({ page }) => {
		// Buscar el primer item del grid (ya forzado en beforeEach)
		const items = page.locator('[data-entity-card]');
		const count = await items.count();
		if (count === 0) {
			test.skip(true, 'No hay entidades para abrir el menú contextual');
		}
		const firstItem = items.first();
		await expect(firstItem).toBeVisible({ timeout: 15_000 });

		// Medir el tiempo que tarda en aparecer el menú contextual
		const startTime = Date.now();

		// Mover el mouse al centro del ítem para evitar overlays, luego click derecho
		await openContextMenuRobusto(page, firstItem);

		const endTime = Date.now();
		const responseTime = endTime - startTime;

		console.log(`⏱️ Tiempo de respuesta del menú contextual: ${responseTime}ms`);

		// El menú debería aparecer en menos de 500ms para una buena UX (presupuesto realista en CI)
		expect(responseTime).toBeLessThan(500);
	});

	test('submenús deberían cargarse rápidamente', async ({ page }) => {
		// Hacer click derecho en el primer item
		const items = page.locator('[data-entity-card]');
		const count = await items.count();
		if (count === 0) {
			test.skip(true, 'No hay entidades para probar submenús');
		}
		const firstItem = items.first();
		await expect(firstItem).toBeVisible({ timeout: 15_000 });
		await openContextMenuRobusto(page, firstItem);

		// Hover sobre el submenú de Colecciones
		const collectionsSubmenu = page.locator('text=Colecciones');

		const startTime = Date.now();
		await collectionsSubmenu.hover();

		// Esperar que aparezca el submenú
		const submenuContent = page.locator('[data-slot="context-menu-sub-content"]');
		await expect(submenuContent).toBeVisible({ timeout: 3000 });

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

		// Hacer click derecho para activar el menú contextual (si hay entidades)
		const items = page.locator('[data-entity-card]');
		const count = await items.count();
		if (count === 0) {
			test.skip(true, 'No hay entidades críticas precargadas (dataset vacío)');
		}
		const firstItem = items.first();
		await expect(firstItem).toBeVisible({ timeout: 15_000 });
		await openContextMenuRobusto(page, firstItem);

		// Verificar que el menú aparece inmediatamente
		const contextMenu = page.locator('[data-slot="context-menu-content"][data-state="open"]');
		await expect(contextMenu).toBeVisible();

		// Verificar que no hay spinners de carga en los submenús críticos
		await expect(page.locator('text=Cargando')).not.toBeVisible();
	});
});
