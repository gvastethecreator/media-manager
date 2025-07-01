# T05 – Migración del **Frontend** (Routing & Layout)

## Objetivo

Sustituir el enrutamiento basado en App Router de Next.js por **React Router v6.23** manteniendo la experiencia de usuario existente.

- Soporte para **cargas diferidas** (lazy) con `React.Suspense` y division de código Vite.
- Persistencia de estado global con **Zustand** sin cambios.
- Navegación protegida vía wrapper `<PrivateRoute>`.

## Árbol de rutas equivalente

```mermaid
graph TD
  Root[/]
  Root --> Images[/images]
  Root --> Albums[/albums]
  Root --> Folders[/folders/:id]
  Root --> Settings[/settings/*]
```

> **Nota:** Se conservarán los mismos slugs para minimizar cambios SEO.

## Pasos de migración

1. **Instalar** dependencias:

   ```bash
   pnpm add react-router-dom@6.23 @types/react-router-dom -D
   ```

2. **Crear** `src/router.tsx`:

   ```tsx
   import { createBrowserRouter } from 'react-router-dom';
   import { ImagesView } from '@/components/views/ImagesView';
   // ...importar resto

   export const router = createBrowserRouter([
     {
       path: '/',
       element: <Layout />,
       children: [
         { index: true, element: <ImagesView /> },
         { path: 'albums', element: <AlbumsView /> },
         {
           path: 'folders/:id',
           element: <FolderContentView />,
           loader: folderLoader // data loader opcional
         },
         { path: 'settings/*', element: <SettingsRoutes /> }
       ]
     }
   ]);
   ```

3. **Reemplazar** uso de `next/link` → `<Link/>` de `react-router-dom`.
4. **Migrar** componentes `Layout` para quitar `next/head`.
5. **Eliminar** `getServerSideProps` y pasar `fetch` al loader cuando sea necesario.
6. **Configurar** slot root en `main.tsx`:

   ```tsx
   import { RouterProvider } from 'react-router-dom';
   import { router } from './router';
   ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
   ```

+Si la aplicación se hospeda bajo subcarpeta, configurar `basename`:

```tsx
createBrowserRouter(routes, { basename: '/image-manager' });
```

### Accesibilidad PrivateRoute

Los componentes `<PrivateRoute>` deben enfocarse automáticamente en primer heading y gestionar `aria-live` para mensajes de redirección.

## SSR o SSG

Actualmente **no** estamos sirviendo SSR incremental. Todo se genera client‐side; por tanto la migración no requiere SSR. No obstante, con **Vite SSR** podemos re‐introducirlo:

- Evaluar plugin `vite-plugin-ssr` si SEO se ve afectado.

## Divisiones de código automáticas

Vite genera chunks por defecto. Se recomienda:

```ts
// vite.config.ts
export default defineConfig({
  build: { rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom'] } } } }
});
```

---

### Validaciones

- [ ] Navegación SPA funciona sin recarga (dev & prod).
- [ ] Rutas protegidas redirigen al login.
- [ ] Tamaño inicial bundle ≤ 300 kB Gzip.

⌛ **Tiempo estimado:** 2 días.
