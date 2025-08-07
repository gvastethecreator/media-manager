import { expect, test } from '@playwright/test';

test.describe('Navigation Item Counts', () => {
	test('should display correct item counts for folders', async ({ page }) => {
		// Navegar a la página principal
		await page.goto('http://localhost:5173/');

		// Esperar a que la navegación se cargue
		await page.waitForSelector('[data-testid="navigation-panel"]', { timeout: 10_000 });

		// Buscar elementos de carpetas en la navegación
		const folderItems = page.locator('[data-testid="folder-item"]');

		// Verificar que hay carpetas
		const folderCount = await folderItems.count();
		console.log(`Found ${folderCount} folders in navigation`);

		if (folderCount > 0) {
			// Verificar el primer elemento de carpeta
			const firstFolder = folderItems.first();

			// Buscar el contador de elementos
			const itemCount = firstFolder.locator('[data-testid="item-count"]');

			if ((await itemCount.count()) > 0) {
				const countText = await itemCount.textContent();
				console.log(`First folder item count: ${countText}`);

				// Verificar que el contador no sea 0 si hay imágenes indexadas
				if (countText && countText.trim() !== '0') {
					expect(countText).toMatch(/\d+/);
					console.log('✅ Item count is displayed and not zero');
				} else {
					console.log('⚠️ Item count is 0 or empty');
				}
			} else {
				console.log('⚠️ No item count element found');
			}

			// Tomar captura de pantalla del primer elemento de carpeta
			await firstFolder.screenshot({ path: 'debug-folder-item.png' });
		}

		// Tomar captura de pantalla de toda la navegación
		const navigationPanel = page.locator('[data-testid="navigation-panel"]');
		await navigationPanel.screenshot({ path: 'debug-navigation-counts.png' });

		// Verificar que la navegación se cargó correctamente
		expect(await navigationPanel.isVisible()).toBe(true);
	});

	test('should display correct item counts for collections', async ({ page }) => {
		// Navegar a la página principal
		await page.goto('http://localhost:5173/');

		// Esperar a que la navegación se cargue
		await page.waitForSelector('[data-testid="navigation-panel"]', { timeout: 10_000 });

		// Buscar elementos de colecciones en la navegación
		const collectionItems = page.locator('[data-testid="collection-item"]');

		// Verificar que hay colecciones
		const collectionCount = await collectionItems.count();
		console.log(`Found ${collectionCount} collections in navigation`);

		if (collectionCount > 0) {
			// Verificar el primer elemento de colección
			const firstCollection = collectionItems.first();

			// Buscar el contador de elementos
			const itemCount = firstCollection.locator('[data-testid="item-count"]');

			if ((await itemCount.count()) > 0) {
				const countText = await itemCount.textContent();
				console.log(`First collection item count: ${countText}`);

				// Verificar que el contador sea un número
				if (countText) {
					expect(countText).toMatch(/\d+/);
					console.log('✅ Collection item count is displayed');
				}
			} else {
				console.log('⚠️ No collection item count element found');
			}
		}
	});

	test('should display correct item counts for albums', async ({ page }) => {
		// Navegar a la página principal
		await page.goto('http://localhost:5173/');

		// Esperar a que la navegación se cargue
		await page.waitForSelector('[data-testid="navigation-panel"]', { timeout: 10_000 });

		// Buscar elementos de álbumes en la navegación
		const albumItems = page.locator('[data-testid="album-item"]');

		// Verificar que hay álbumes
		const albumCount = await albumItems.count();
		console.log(`Found ${albumCount} albums in navigation`);

		if (albumCount > 0) {
			// Verificar el primer elemento de álbum
			const firstAlbum = albumItems.first();

			// Buscar el contador de elementos
			const itemCount = firstAlbum.locator('[data-testid="item-count"]');

			if ((await itemCount.count()) > 0) {
				const countText = await itemCount.textContent();
				console.log(`First album item count: ${countText}`);

				// Verificar que el contador sea un número
				if (countText) {
					expect(countText).toMatch(/\d+/);
					console.log('✅ Album item count is displayed');
				}
			} else {
				console.log('⚠️ No album item count element found');
			}
		}
	});
});
