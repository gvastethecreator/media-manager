import { expect, test } from '@playwright/test';

test.describe('Selección con Drag - Performance y Funcionalidad', () => {
	test.beforeEach(async ({ page }) => {
		// Ir a la página de carpetas con imágenes
		await page.goto('http://localhost:5173/folders/cartoons');
		await page.waitForSelector('[data-testid="file-browser"]', { timeout: 10_000 });

		// Esperar a que se carguen las imágenes
		await page.waitForFunction(
			() => {
				const images = document.querySelectorAll('[data-item-id]');
				return images.length > 10;
			},
			{ timeout: 15_000 }
		);
	});

	test('Performance - No hay re-renders masivos durante hover', async ({ page }) => {
		// Monitor de performance
		let renderCount = 0;

		await page.addInitScript(() => {
			const originalConsoleLog = console.log;
			window.renderCount = 0;
			console.log = (...args) => {
				const message = args.join(' ');
				if (message.includes('render') || message.includes('Re-render')) {
					window.renderCount++;
				}
				originalConsoleLog.apply(console, args);
			};
		});

		// Hover sobre varios elementos
		const items = await page.locator('[data-item-id]').all();
		for (let i = 0; i < Math.min(5, items.length); i++) {
			await items[i].hover();
			await page.waitForTimeout(100);
		}

		// Verificar que no hay demasiados re-renders
		renderCount = await page.evaluate(() => window.renderCount || 0);
		console.log(`📊 Total renders durante hover: ${renderCount}`);
		expect(renderCount).toBeLessThan(20); // Máximo 20 renders para 5 hovers
	});

	test('Grid View - Selección con drag funciona', async ({ page }) => {
		// Cambiar a vista Grid
		await page.click('[data-testid="view-grid"]');
		await page.waitForSelector('[data-view-type="grid"]', { timeout: 5000 });

		// Obtener elementos para drag selection
		const items = await page.locator('[data-item-id]').all();
		expect(items.length).toBeGreaterThan(0);

		// Realizar drag selection
		const firstItem = items[0];
		const thirdItem = items[2];

		const firstBox = await firstItem.boundingBox();
		const thirdBox = await thirdItem.boundingBox();

		if (firstBox && thirdBox) {
			// Iniciar drag desde antes del primer elemento
			await page.mouse.move(firstBox.x - 10, firstBox.y - 10);
			await page.mouse.down();

			// Drag hasta después del tercer elemento
			await page.mouse.move(thirdBox.x + thirdBox.width + 10, thirdBox.y + thirdBox.height + 10);
			await page.mouse.up();

			// Verificar que los elementos están seleccionados
			await page.waitForTimeout(500);
			const selectedElements = await page.locator('.selecto-selected').count();
			console.log(`🎯 Elementos seleccionados por drag: ${selectedElements}`);
			expect(selectedElements).toBeGreaterThan(0);

			// Verificar estado del contador de selección
			const statusBar = await page.locator('text=/Seleccionados: [0-9]+/');
			await expect(statusBar).toBeVisible();
		}
	});

	test('Cards View - Selección con drag funciona', async ({ page }) => {
		// Cambiar a vista Cards
		await page.click('[data-testid="view-cards"]');
		await page.waitForSelector('[data-view-type="cards"]', { timeout: 5000 });

		// Realizar drag selection
		const items = await page.locator('[data-item-id]').all();
		expect(items.length).toBeGreaterThan(0);

		const firstItem = items[0];
		const secondItem = items[1];

		const firstBox = await firstItem.boundingBox();
		const secondBox = await secondItem.boundingBox();

		if (firstBox && secondBox) {
			// Realizar drag selection
			await page.mouse.move(firstBox.x - 5, firstBox.y - 5);
			await page.mouse.down();
			await page.mouse.move(secondBox.x + secondBox.width + 5, secondBox.y + secondBox.height + 5);
			await page.mouse.up();

			// Verificar selección
			await page.waitForTimeout(500);
			const selectedElements = await page.locator('.selecto-selected').count();
			console.log(`🎯 Cards - Elementos seleccionados: ${selectedElements}`);
			expect(selectedElements).toBeGreaterThan(0);
		}
	});

	test('List View - Selección con drag funciona', async ({ page }) => {
		// Cambiar a vista List
		await page.click('[data-testid="view-list"]');
		await page.waitForSelector('[data-view-type="list"]', { timeout: 5000 });

		// Realizar drag selection
		const items = await page.locator('[data-item-id]').all();
		expect(items.length).toBeGreaterThan(0);

		const firstItem = items[0];
		const thirdItem = items[2];

		const firstBox = await firstItem.boundingBox();
		const thirdBox = await thirdItem.boundingBox();

		if (firstBox && thirdBox) {
			// Realizar drag selection
			await page.mouse.move(firstBox.x - 5, firstBox.y);
			await page.mouse.down();
			await page.mouse.move(thirdBox.x + thirdBox.width + 5, thirdBox.y + thirdBox.height);
			await page.mouse.up();

			// Verificar selección
			await page.waitForTimeout(500);
			const selectedElements = await page.locator('.selecto-selected').count();
			console.log(`🎯 List - Elementos seleccionados: ${selectedElements}`);
			expect(selectedElements).toBeGreaterThan(0);
		}
	});

	test('Performance - Clicks son instantáneos', async ({ page }) => {
		let clickStartTime: number;
		let responseTime: number;

		// Test de click individual
		const firstItem = page.locator('[data-item-id]').first();

		clickStartTime = Date.now();
		await firstItem.click();

		// Esperar a que aparezca la selección
		await page.waitForSelector('.selecto-selected, [aria-selected="true"]', { timeout: 1000 });
		responseTime = Date.now() - clickStartTime;

		console.log(`⚡ Tiempo de respuesta de click: ${responseTime}ms`);
		expect(responseTime).toBeLessThan(500); // Menos de 500ms para respuesta

		// Test de múltiples clicks rápidos
		clickStartTime = Date.now();
		const items = await page.locator('[data-item-id]').all();

		for (let i = 0; i < Math.min(3, items.length); i++) {
			await items[i].click();
			await page.waitForTimeout(50); // Pequeña pausa entre clicks
		}

		responseTime = Date.now() - clickStartTime;
		console.log(`⚡ Tiempo para 3 clicks consecutivos: ${responseTime}ms`);
		expect(responseTime).toBeLessThan(1000); // Menos de 1 segundo para 3 clicks
	});

	test('Ctrl+Click y Drag Selection se integran correctamente', async ({ page }) => {
		// Seleccionar un elemento con click normal
		const firstItem = page.locator('[data-item-id]').first();
		await firstItem.click();

		// Verificar selección
		await expect(page.locator('text=/Seleccionados: 1/')).toBeVisible();

		// Hacer drag selection de otros elementos
		const items = await page.locator('[data-item-id]').all();
		if (items.length > 3) {
			const thirdItem = items[2];
			const fourthItem = items[3];

			const thirdBox = await thirdItem.boundingBox();
			const fourthBox = await fourthItem.boundingBox();

			if (thirdBox && fourthBox) {
				// Drag selection manteniendo Ctrl
				await page.keyboard.down('Control');
				await page.mouse.move(thirdBox.x - 5, thirdBox.y - 5);
				await page.mouse.down();
				await page.mouse.move(fourthBox.x + fourthBox.width + 5, fourthBox.y + fourthBox.height + 5);
				await page.mouse.up();
				await page.keyboard.up('Control');

				// Verificar que ahora hay más elementos seleccionados
				await page.waitForTimeout(500);
				const selectedCount = await page.locator('.selecto-selected').count();
				console.log(`🎯 Total elementos seleccionados (click + drag): ${selectedCount}`);
				expect(selectedCount).toBeGreaterThan(1);
			}
		}
	});

	test('Visual feedback durante drag selection', async ({ page }) => {
		// Verificar que aparece el área de selección visual
		const items = await page.locator('[data-item-id]').all();
		if (items.length > 1) {
			const firstItem = items[0];
			const secondItem = items[1];

			const firstBox = await firstItem.boundingBox();
			const secondBox = await secondItem.boundingBox();

			if (firstBox && secondBox) {
				// Iniciar drag
				await page.mouse.move(firstBox.x - 10, firstBox.y - 10);
				await page.mouse.down();

				// Durante el drag, debería aparecer el área de selección
				await page.mouse.move(firstBox.x + 50, firstBox.y + 50);

				// Verificar que hay feedback visual (área de selección)
				const hasSelectoArea = await page.locator('.selecto-area, .selecto-selection').count();
				console.log(`👁️ Área de selección visible: ${hasSelectoArea > 0}`);

				// Completar el drag
				await page.mouse.move(secondBox.x + secondBox.width, secondBox.y + secondBox.height);
				await page.mouse.up();

				// Verificar que hay elementos con clase selecto-selected
				await page.waitForTimeout(300);
				const selectedElements = await page.locator('.selecto-selected').count();
				console.log(`✅ Elementos seleccionados al final: ${selectedElements}`);
				expect(selectedElements).toBeGreaterThan(0);
			}
		}
	});
});
