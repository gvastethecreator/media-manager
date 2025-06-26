import { expect, test } from '@playwright/test';

test.describe('Image Manager - Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Verificar que la página carga correctamente
    await expect(page).toHaveTitle(/Image Manager/);

    // Tomar una captura de pantalla para verificación visual
    await page.screenshot({ path: 'test-results/homepage.png' });
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Esperar a que el contenido principal cargue
    await page.waitForLoadState('networkidle');

    // Verificar que existen elementos de navegación básicos
    // Nota: Ajustar estos selectores según la estructura real de la aplicación
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Test básico de que la aplicación React se monta
    await page.waitForFunction(() => {
      return document.querySelector('[data-testid], main, #root, #__next') !== null;
    });
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test en viewport desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/desktop-view.png' });

    // Test en viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/mobile-view.png' });

    // Test en viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/tablet-view.png' });
  });
});