import { test, expect } from '@playwright/test';

// Prueba básica para verificar que la página principal carga

test('carga la página principal', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/Sistema de Gestión de Imágenes/);
});
