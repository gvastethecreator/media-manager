import { expect, test } from '@playwright/test';

// Prueba básica para verificar que la página principal carga

test('carga la página principal', async ({ page }) => {
	await page.goto('/', { waitUntil: 'networkidle' });
	await expect(page).toHaveTitle(/Sistema de Gestión de Imágenes/);
});
