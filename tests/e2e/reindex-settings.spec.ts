import { expect, test } from '@playwright/test';

// Regex declarados a nivel superior (lint rule)
const REINDEXING_RE = /Reindexando/;

// Contrato mínimo:
// - Navega a /settings
// - Verifica presencia de botón reindex-all
// - Dispara reindex y espera señal de progreso y fin
// - Valida que cambien los stats (o al menos se refetchen) y que existan contadores en navegación

test.describe('Reindex en Settings', () => {
	test('reindex-all refresca UI (cards, nav y stats)', async ({ page }) => {
		await page.goto('/settings');

		// Asegurar render básico de sección
		await expect(page.getByTestId('folders-settings')).toBeVisible();

		// Guardar valores iniciales (no siempre cambian, pero sirven de sincronización)
		const initialFolders = await page
			.getByTestId('stats-total-folders')
			.textContent()
			.catch(() => null);
		const initialFiles = await page
			.getByTestId('stats-total-files')
			.textContent()
			.catch(() => null);

		// Lanzar reindex global
		const reindexBtn = page.getByTestId('reindex-all-button');
		await expect(reindexBtn).toBeEnabled();
		await reindexBtn.click();

		// Debe aparecer indicador de progreso (si la UI lo muestra) o el botón cambia a "Reindexando..."
		const progress = page.getByTestId('reindex-global-progress');
		const btn = page.getByTestId('reindex-all-button');
		await Promise.race<unknown>([
			progress
				.waitFor({ state: 'visible', timeout: 30_000 })
				.then(() => 'progress-visible')
				.catch(() => 'no-progress'),
			expect(btn)
				.toHaveText(REINDEXING_RE, { timeout: 30_000 })
				.then(() => 'button-updated'),
		]);

		// Esperar a que termine: o se oculta el progress o el botón vuelve a "Reindexar todo"
		await Promise.race<unknown>([
			progress
				.waitFor({ state: 'hidden', timeout: 120_000 })
				.then(() => 'progress-hidden')
				.catch(() => 'progress-still-on'),
			expect(btn)
				.toHaveText('Reindexar todo', { timeout: 120_000 })
				.then(() => 'button-reset'),
		]);

		// Validar que Stats estén visibles y actualizados (al menos refetch)
		await expect(page.getByTestId('folders-stats')).toBeVisible();
		const afterFolders = await page
			.getByTestId('stats-total-folders')
			.textContent()
			.catch(() => null);
		const afterFiles = await page
			.getByTestId('stats-total-files')
			.textContent()
			.catch(() => null);

		// No exigir cambio numérico estricto (puede no variar), pero asegurar consistencia y presencia
		expect(afterFolders).toBeTruthy();
		expect(afterFiles).toBeTruthy();

		// Validar que existan contadores de navegación clave (imágenes y videos al menos)
		// La navegación está en el layout, aseguramos presencia de contadores
		await expect(page.locator('[data-testid="nav-count-all-images"]')).toBeVisible();
		await expect(page.locator('[data-testid="nav-count-videos"]')).toBeVisible();
	});
});
