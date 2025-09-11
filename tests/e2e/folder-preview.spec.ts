import { test, expect, Page } from '@playwright/test';

// Verifica que el endpoint de preview devuelva un SVG cacheable
// Usa una carpeta conocida desde la UI navegable: raíz o primera carpeta listada
// Precondición: el servidor dev:full expone /api/folders/:id/preview y existe al menos una carpeta

async function getAnyFolderId(page: Page) {
  // Navega a la app y obtiene la primera carpeta visible si hay UI para ello
  await page.goto('/');
  // Fallback: llamar a la API de carpetas para obtener una
  const resp = await page.request.get('/api/folders?limit=1');
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  const folder = Array.isArray(data) ? data[0] : data.data?.[0] ?? data[0];
  expect(folder?.id).toBeTruthy();
  return folder.id as string;
}

test.describe('Folder Preview API', () => {
  test('GET /api/folders/:id/preview devuelve SVG con cache headers', async ({ page }) => {
    const folderId = await getAnyFolderId(page);

    const res = await page.request.get(`/api/folders/${folderId}/preview`);
    expect(res.ok()).toBeTruthy();

    const ctype = res.headers()['content-type'] || res.headers()['Content-Type'];
    expect(ctype).toContain('image/svg+xml');

    const cache = res.headers()['cache-control'] || res.headers()['Cache-Control'];
    expect(cache).toMatch(/max-age=\d+/);

    const body = await res.text();
    expect(body).toContain('<svg');
    expect(body).toContain('</svg>');
  });
});
