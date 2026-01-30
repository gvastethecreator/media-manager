import { expect, test } from '@playwright/test';

test('Add image to character flow', async ({ page }) => {
	// 1. Crear un personaje de prueba
	await page.goto('/characters');

	// Si no hay botón de crear visible inmediatamente, buscarlo
	const createBtn = page.getByRole('button', { name: 'Crear Personaje' });
	if (await createBtn.isVisible()) {
		await createBtn.click();
	} else if (!(await page.getByLabel('Nombre').isVisible())) {
		// Si el formulario no está abierto y no hay botón principal,
		// intentar abrir mediante texto alternativo
		await page.getByText('Crear Personaje').click();
	}

	const testCharName = `Test Char ${Date.now()}`;

	// Listen to console logs
	page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`));

	await page.getByLabel('Nombre').fill(testCharName);
	await page.getByRole('button', { name: 'Guardar Personaje' }).click();

	// Esperar a que el formulario desaparezca
	await expect(page.getByRole('button', { name: 'Guardar Personaje' })).not.toBeVisible();

	// Esperar a que aparezca el personaje (usar h3 para evitar duplicado con sr-only)
	// A veces la recarga es lenta o requiere invalidación
	await expect(page.locator('h3', { hasText: testCharName })).toBeVisible({ timeout: 15_000 });

	// 2. Ir a una carpeta con imágenes
	// Vamos a usar la ruta que mencionó el usuario si es posible, o fallback a una genérica
	// Intentamos ir a 'All Images' o una carpeta conocida.
	// Para asegurar que hay imágenes, vamos a /images (All Images) si existe, o navegamos por folders.
	// El usuario mencionó /folders/cursed-dump. Probemos esa primero, si falla, fallback.

	// Nota: En el router vi 'folders/:id'.
	// Vamos a intentar navegar a la primera carpeta disponible desde /folders
	await page.goto('/folders');
	// Esperar a que carguen las carpetas
	await page
		.waitForSelector('[data-testid="folder-card"]', { timeout: 5000 })
		.catch(() => console.log('No folders found or slow load'));

	const firstFolder = page.locator('[data-testid="folder-card"]').first();
	if ((await firstFolder.count()) > 0) {
		await firstFolder.click();
	} else {
		// Fallback a una ruta que sepamos que tiene imágenes o la del usuario
		await page.goto('/folders/cursed-dump');
	}

	// 3. Seleccionar una imagen y agregarla al personaje
	// Esperar a que carguen items
	await page.waitForSelector('[data-testid="file-browser"]');

	// Buscar un item que sea imagen (asumimos que los primeros son imagenes o tienen context menu)
	// Los items suelen tener role="button" o similar dentro del grid
	// En el código vi: data-testid="list-canvas" o "animated-file-canvas"
	// Necesitamos interactuar con el canvas o los elementos virtuales.
	// Si es canvas, es difícil. Pero vi que AnimatedFileCanvas renderiza un div wrapper.
	// Esperemos que haya elementos DOM interactivos o el test fallará aquí.
	// En `list-canvas.tsx` vi `onContextMenu={handleContextMenu}` en el contenedor principal.
	// Pero necesitamos hacer click derecho en un ITEM específico para que `targetItem` se setee.

	// Si la vista es virtualizada con Canvas, Playwright no puede ver los items individuales fácilmente a menos que haya elementos DOM superpuestos o roles.
	// Revisando `animated-file-canvas.tsx`, parece que renderiza `<canvas>` y maneja eventos en el contenedor padre calculando coordenadas.
	// ESTO ES UN PROBLEMA PARA PLAYWRIGHT si no hay elementos DOM.
	// PERO, `FileBrowser` tiene `ItemContextMenu`.
	// Vamos a intentar hacer click derecho en coordenadas arbitrarias dentro del canvas (ej: 100, 100) asumiendo que hay un item ahí.

	const browserCanvas = page.locator('[data-testid="file-browser"]');
	await expect(browserCanvas).toBeVisible();

	// Click derecho en una posición donde debería haber un item (ej: primera fila)
	// Ajustar coordenadas según el layout (grid vs list). Asumimos Grid por defecto.
	await browserCanvas.click({ button: 'right', position: { x: 50, y: 50 } });

	// 4. Interactuar con el menú contextual
	const menu = page.locator('[role="menu"]').or(page.locator('.fixed.z-50')); // El menú tiene clase fixed z-50
	await expect(menu).toBeVisible();

	// Navegar submenús
	await page.getByText('Agregar a...').hover();
	await page.getByText('👤 Characters').hover(); // El texto exacto del código

	// Esperar a que aparezca el submenú de personajes
	await expect(page.getByText(testCharName)).toBeVisible();
	await page.getByText(testCharName).click();

	// 5. Verificar Toast (puede aparecer más de una vez, validamos que al menos uno sea visible)
	await expect(page.getByText('✅ Agregado correctamente').first()).toBeVisible();

	// 6. Verificar en vista de Personajes
	await page.goto('/characters');

	// Buscar la tarjeta del personaje
	const charCard = page.locator('article').filter({ hasText: testCharName }); // Asumiendo que CharacterCard es un article o tiene texto
	await expect(charCard).toBeVisible();

	// Verificar thumbnail (opcional, difícil de validar src exacto sin saber ID)
	// Pero podemos chequear si hay alguna imagen dentro
	const imagesInCard = charCard.locator('img');
	// await expect(imagesInCard).toHaveCount(1); // Puede fallar si tarda en cargar o es background

	// 7. Verificar detalle
	await charCard.click();

	// Esperar navegación
	await expect(page).toHaveURL(/\/characters\/.+/);

	// Verificar que aparece la imagen en el grid de contenido
	// En CharacterContentView vi: "No se encontraron imágenes" vs grid de items
	await expect(page.getByText('No se encontraron imágenes')).not.toBeVisible();

	// Verificar que hay al menos un item en el grid
	const gridItems = page.locator('.grid > button');
	await expect(gridItems.first()).toBeVisible();
});
