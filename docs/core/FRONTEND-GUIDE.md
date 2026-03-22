# Guía de Frontend

## Image Manager - Desarrollo de UI

**Versión:** 0.1.0  
**Framework:** React 19.2.3 + Vite 7.3.0  
**Última Actualización:** 31 de diciembre de 2025

---

## 1. Visión General

El frontend de Image Manager está construido con React 19 y Vite, utilizando una arquitectura modular con componentes reutilizables, estado global con Zustand y data fetching con TanStack Query.

### 1.1 Stack Principal

| Tecnología       | Versión | Propósito              |
| ---------------- | ------- | ---------------------- |
| React            | 19.2.3  | Framework UI           |
| Vite             | 7.3.0   | Bundler/Dev Server     |
| TypeScript       | 5.9.3   | Type Safety            |
| Tailwind CSS     | 4.1.18  | Estilos                |
| Radix UI         | latest  | Componentes accesibles |
| Zustand          | 5.0.9   | Estado global          |
| TanStack Query   | 5.90.14 | Data fetching          |
| TanStack Virtual | 3.13.13 | Virtualización         |
| React Router     | 7.11.0  | Routing                |
| GSAP             | 3.14.2  | Animaciones            |

---

## 2. Estructura del Proyecto

```
src/
├── app/                    # Configuración de aplicación
│   ├── globals.css        # Estilos globales
│   └── themes.css         # Variables de temas
├── components/             # Componentes React
│   ├── common/            # Componentes reutilizables
│   ├── core/              # Componentes fundamentales
│   ├── entities/          # Componentes por entidad
│   ├── features/          # Features complejas
│   ├── layout/            # Layouts
│   ├── navigation/        # Navegación
│   ├── panels/            # Paneles
│   ├── settings/          # Configuración
│   ├── toolbar/           # Barras de herramientas
│   ├── ui/                # Primitivos UI
│   └── views/             # Vistas/páginas
├── config/                 # Configuración
├── constants/              # Constantes
├── hooks/                  # Custom hooks
├── lib/                    # Librerías
│   ├── api/               # Cliente API
│   ├── client/            # Utilidades cliente
│   └── utils/             # Utilidades
├── providers/              # Context providers
├── store/                  # Estado Zustand
│   ├── entities/          # Stores por entidad
│   └── ui/                # Stores de UI
├── styles/                 # Estilos adicionales
├── types/                  # Tipos TypeScript
├── utils/                  # Utilidades
├── main.tsx               # Punto de entrada
└── router.tsx             # Configuración de rutas
```

---

## 3. Componentes

### 3.1 Jerarquía de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                       MainLayout                             │
│ ┌─────────────┬────────────────────────────┬──────────────┐ │
│ │  NavPanel   │       Content Area         │ RightPanel   │ │
│ │  (Left)     │    (Router Outlet)         │  (Details)   │ │
│ │             │                            │              │ │
│ │ - Tree      │  ┌──────────────────────┐  │ - Entity     │ │
│ │ - Quick     │  │     ViewToolbar      │  │   Details    │ │
│ │   Access    │  ├──────────────────────┤  │ - Actions    │ │
│ │             │  │                      │  │ - Stats      │ │
│ │             │  │    Vista Actual      │  │              │ │
│ │             │  │  (Grid/List/Cards)   │  │              │ │
│ │             │  │                      │  │              │ │
│ │             │  │                      │  │              │ │
│ │             │  └──────────────────────┘  │              │ │
│ └─────────────┴────────────────────────────┴──────────────┘ │
│                        FileViewer (Modal)                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Componentes UI (`/ui`)

Basados en Radix UI con estilos de Tailwind:

```tsx
// Ejemplo de uso
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function MyComponent() {
	return (
		<Card>
			<CardHeader>
				<h2>Título</h2>
			</CardHeader>
			<CardContent>
				<Input placeholder="Buscar..." />
				<Button variant="primary">Buscar</Button>
				<Badge variant="success">Activo</Badge>
			</CardContent>
		</Card>
	);
}
```

**Componentes disponibles:**

| Categoría      | Componentes                                                          |
| -------------- | -------------------------------------------------------------------- |
| **Botones**    | Button, ButtonGroup, Toggle, ToggleGroup                             |
| **Inputs**     | Input, InputGroup, Textarea, Checkbox, Radio, Switch, Slider, Select |
| **Display**    | Badge, Avatar, Card, Tooltip, HoverCard                              |
| **Feedback**   | Alert, Toast, Progress, Spinner, Skeleton                            |
| **Overlay**    | Dialog, Sheet, Popover, DropdownMenu, ContextMenu                    |
| **Navigation** | Tabs, Accordion, Breadcrumb, NavigationMenu                          |
| **Layout**     | Separator, AspectRatio, ScrollArea, ResizablePanel                   |
| **Data**       | Table, DataGrid, Pagination                                          |

### 3.3 Componentes de Features

#### File Browser

```tsx
// Navegador de archivos principal
import { FileBrowser } from '@/components/features/file-browser';

function FolderView({ folderId }: { folderId: string }) {
	return (
		<FileBrowser
			folderId={folderId}
			viewMode="grid"
			onSelect={(items) => console.log('Selected:', items)}
			onOpen={(item) => console.log('Open:', item)}
		/>
	);
}
```

**Vistas disponibles:**

- `GridView` - Cuadrícula de thumbnails
- `ListView` - Lista con detalles
- `CardsView` - Tarjetas con más información
- `MasonryView` - Disposición tipo Pinterest
- `TrueMasonryView` - Masonry avanzado

#### File Viewer

```tsx
// Visor de archivos modal
import { FileViewer } from '@/components/features/file-viewer';
import { useFileViewerStore } from '@/store/file-view.store';

function App() {
	const { isOpen, currentItem, close } = useFileViewerStore();

	return (
		<>
			{/* Contenido de la app */}
			<FileViewer
				isOpen={isOpen}
				item={currentItem}
				onClose={close}
				onNavigate={(direction) => {
					/* navegar */
				}}
			/>
		</>
	);
}
```

### 3.4 Componentes de Entidad

```tsx
// Componentes específicos por tipo de entidad
import { ImageCard } from '@/components/entities/image';
import { VideoCard } from '@/components/entities/video';
import { TagBadge } from '@/components/entities/tag';
import { AlbumCard } from '@/components/entities/album';
import { CharacterCard } from '@/components/entities/character';

// EntityCard genérico
import { EntityCard } from '@/components/cards/entity-card';

function Gallery({ items }) {
	return (
		<div className="grid grid-cols-4 gap-4">
			{items.map((item) => (
				<EntityCard key={item.id} entity={item} entityType={item.type} onClick={() => handleClick(item)} />
			))}
		</div>
	);
}
```

---

## 4. Estado Global

### 4.1 Zustand Stores

#### Selection Store

```tsx
import { useSelectionStore } from '@/store/selection.store';

function SelectableGrid({ items }) {
	const { selectedIds, toggleSelection, clearSelection, isSelected, setMultiSelectMode } = useSelectionStore();

	return (
		<div>
			<button onClick={clearSelection}>Limpiar selección</button>
			{items.map((item) => (
				<div
					key={item.id}
					onClick={() => toggleSelection(item.id, item)}
					className={isSelected(item.id) ? 'selected' : ''}
				>
					{item.name}
				</div>
			))}
			<p>{selectedIds.length} seleccionados</p>
		</div>
	);
}
```

#### UI Store

```tsx
import { useUIStore } from '@/store/ui.store';

function Sidebar() {
	const { isSidebarCollapsed, toggleSidebar, viewMode, setViewMode } = useUIStore();

	return (
		<aside className={isSidebarCollapsed ? 'collapsed' : ''}>
			<button onClick={toggleSidebar}>Toggle</button>
			<select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
				<option value="grid">Grid</option>
				<option value="list">List</option>
				<option value="cards">Cards</option>
			</select>
		</aside>
	);
}
```

#### Entity Stores

```tsx
import { useImageStore } from '@/store/entities/image';
import { useTagStore } from '@/store/entities/tag';
import { useFolderStore } from '@/store/entities/folder';

function ImageList() {
	const { images, loading, error, fetchImages, updateImage } = useImageStore();

	useEffect(() => {
		fetchImages({ folderId: 'folder_123' });
	}, []);

	if (loading) return <Spinner />;
	if (error) return <Error message={error} />;

	return (
		<div>
			{images.map((image) => (
				<ImageCard
					key={image.id}
					image={image}
					onFavorite={() => updateImage(image.id, { isFavorite: !image.isFavorite })}
				/>
			))}
		</div>
	);
}
```

### 4.2 Estructura de Stores

```
src/store/
├── entities/
│   ├── image/
│   │   ├── image.store.ts      # Store principal
│   │   ├── image.slice.ts      # Slice del store
│   │   └── index.ts
│   ├── folder/
│   ├── tag/
│   ├── album/
│   └── ...
├── ui/
│   ├── view-options.slice.ts
│   └── sidebar.slice.ts
├── selection.store.ts
├── settings.store.ts
├── file-view.store.ts
├── details-panel.store.ts
└── index.ts
```

---

## 5. Data Fetching

### 5.1 TanStack Query Setup

```tsx
// src/providers/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutos
			gcTime: 10 * 60 * 1000, // 10 minutos
			refetchOnWindowFocus: false,
			retry: 2,
		},
	},
});

export function QueryProvider({ children }) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
```

### 5.2 Hooks de Query

```tsx
// src/lib/api/images.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { imagesApi } from './client';

// Query hook
export function useImages(folderId: string) {
	return useQuery({
		queryKey: ['images', 'byFolder', folderId],
		queryFn: () => imagesApi.getByFolder(folderId),
		enabled: !!folderId,
	});
}

export function useImage(id: string) {
	return useQuery({
		queryKey: ['images', id],
		queryFn: () => imagesApi.getById(id),
		enabled: !!id,
	});
}

// Mutation hook
export function useUpdateImage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }) => imagesApi.update(id, data),
		onSuccess: (data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['images', id] });
			queryClient.invalidateQueries({ queryKey: ['images', 'byFolder'] });
		},
	});
}

export function useDeleteImage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => imagesApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['images'] });
		},
	});
}
```

### 5.3 Uso en Componentes

```tsx
function ImageGallery({ folderId }) {
	const { data, isLoading, error, refetch } = useImages(folderId);
	const updateMutation = useUpdateImage();

	if (isLoading) return <Skeleton count={12} />;
	if (error) return <Alert variant="error">{error.message}</Alert>;

	const handleFavorite = (image) => {
		updateMutation.mutate({
			id: image.id,
			data: { isFavorite: !image.isFavorite },
		});
	};

	return (
		<div className="grid grid-cols-4 gap-4">
			{data.images.map((image) => (
				<ImageCard key={image.id} image={image} onFavorite={() => handleFavorite(image)} />
			))}
		</div>
	);
}
```

---

## 6. Routing

### 6.1 Configuración

```tsx
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <MainLayout />,
		children: [
			{ index: true, element: <Dashboard /> },
			{ path: 'settings', element: <SettingsView /> },
			{ path: 'folders', element: <FoldersView /> },
			{ path: 'folders/:id/*', element: <HierarchicalFolderWrapper /> },
			{ path: 'all-images', element: <AllImagesView /> },
			{ path: 'videos', element: <VideosView /> },
			{ path: 'audios', element: <AudioView /> },
			{ path: 'tags', element: <TagsView /> },
			{ path: 'tags/:id', element: <TagContentView /> },
			{ path: 'albums', element: <AlbumsView /> },
			{ path: 'albums/:id', element: <AlbumContentView /> },
			{ path: 'characters', element: <CharactersView /> },
			{ path: 'characters/:id', element: <CharacterContentView /> },
			// ... más rutas
			{ path: '*', element: <NotFoundPage /> },
		],
	},
]);
```

### 6.2 Lazy Loading

```tsx
// Carga diferida de componentes pesados
const CharactersView = lazy(() =>
	import('@/components/views/characters/characters-view').then((m) => ({ default: m.CharactersView }))
);

// Uso con Suspense
function App() {
	return (
		<Suspense fallback={<LoadingPage />}>
			<RouterProvider router={router} />
		</Suspense>
	);
}
```

---

## 7. Virtualización

### 7.1 Grid Virtualizado

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedGrid({ items, columns = 4 }) {
	const parentRef = useRef(null);
	const rows = Math.ceil(items.length / columns);

	const virtualizer = useVirtualizer({
		count: rows,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 200, // altura estimada de cada fila
		overscan: 5,
	});

	return (
		<div ref={parentRef} className="h-full overflow-auto">
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					position: 'relative',
				}}
			>
				{virtualizer.getVirtualItems().map((virtualRow) => {
					const startIndex = virtualRow.index * columns;
					const rowItems = items.slice(startIndex, startIndex + columns);

					return (
						<div
							key={virtualRow.key}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
							}}
							className="grid grid-cols-4 gap-4"
						>
							{rowItems.map((item) => (
								<ItemCard key={item.id} item={item} />
							))}
						</div>
					);
				})}
			</div>
		</div>
	);
}
```

### 7.2 Lista Virtualizada

```tsx
function VirtualizedList({ items }) {
	const parentRef = useRef(null);

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 48,
		overscan: 10,
	});

	return (
		<div ref={parentRef} className="h-full overflow-auto">
			<div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
				{virtualizer.getVirtualItems().map((virtualItem) => (
					<div
						key={virtualItem.key}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: `${virtualItem.size}px`,
							transform: `translateY(${virtualItem.start}px)`,
						}}
					>
						<ListItem item={items[virtualItem.index]} />
					</div>
				))}
			</div>
		</div>
	);
}
```

---

## 8. Hooks Personalizados

### 8.1 Hooks de Configuración

```tsx
// src/hooks/use-settings.ts
export function useSettings<T>(key: string, defaultValue: T) {
	const { settings, updateSetting } = useSettingsStore();

	const value = settings[key] ?? defaultValue;
	const setValue = useCallback(
		(newValue: T) => {
			updateSetting(key, newValue);
		},
		[key, updateSetting]
	);

	return [value, setValue] as const;
}

// Uso
function MyComponent() {
	const [theme, setTheme] = useSettings('ui.theme', 'dark');
}
```

### 8.2 Hooks de Vista

```tsx
// src/hooks/use-grid-view-config.ts
export function useGridViewConfig() {
	const [columns, setColumns] = useSettings('grid.columns', 4);
	const [gap, setGap] = useSettings('grid.gap', 16);
	const [showLabels, setShowLabels] = useSettings('grid.showLabels', true);

	return {
		columns,
		setColumns,
		gap,
		setGap,
		showLabels,
		setShowLabels,
	};
}
```

### 8.3 Hooks de Selección

```tsx
// src/hooks/use-advanced-selection.ts
export function useAdvancedSelection(items: EntityWithStats[]) {
	const { selectedIds, setSelectedIds, clearSelection } = useSelectionStore();

	const selectAll = useCallback(() => {
		setSelectedIds(items.map((i) => i.id));
	}, [items, setSelectedIds]);

	const selectRange = useCallback(
		(fromId: string, toId: string) => {
			const fromIndex = items.findIndex((i) => i.id === fromId);
			const toIndex = items.findIndex((i) => i.id === toId);
			const [start, end] = [Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex)];
			const rangeIds = items.slice(start, end + 1).map((i) => i.id);
			setSelectedIds(rangeIds);
		},
		[items, setSelectedIds]
	);

	const invertSelection = useCallback(() => {
		const newSelection = items.filter((i) => !selectedIds.includes(i.id)).map((i) => i.id);
		setSelectedIds(newSelection);
	}, [items, selectedIds, setSelectedIds]);

	return {
		selectAll,
		selectRange,
		invertSelection,
		clearSelection,
		selectedCount: selectedIds.length,
		isAllSelected: selectedIds.length === items.length,
	};
}
```

---

## 9. Estilos y Temas

### 9.1 Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
	content: ['./src/**/*.{ts,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				// ... más colores
			},
			animation: {
				'fade-in': 'fadeIn 0.2s ease-out',
				'slide-up': 'slideUp 0.3s ease-out',
			},
		},
	},
	plugins: [require('tw-animate-css')],
};
```

### 9.2 CSS Variables (Temas)

```css
/* src/app/themes.css */
:root {
	--background: 0 0% 100%;
	--foreground: 222.2 84% 4.9%;
	--primary: 222.2 47.4% 11.2%;
	--primary-foreground: 210 40% 98%;
	/* ... */
}

.dark {
	--background: 222.2 84% 4.9%;
	--foreground: 210 40% 98%;
	--primary: 210 40% 98%;
	--primary-foreground: 222.2 47.4% 11.2%;
	/* ... */
}
```

### 9.3 Utilidades de Estilo

```tsx
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Uso
<div className={cn('base-class', isActive && 'active-class', variant === 'primary' && 'primary-variant')} />;
```

---

## 10. Animaciones

### 10.1 GSAP y motion-shim

```tsx
import { motion } from '@/components/ui/motion-shim';
import { useEffect, useRef } from 'react';

function AnimatedCard({ item }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
		>
			{/* contenido */}
		</motion.div>
	);
}
```

### 10.2 Transiciones CSS

```tsx
function FadeIn({ children, show }) {
	return (
		<div className={cn('transition-opacity duration-300', show ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
			{children}
		</div>
	);
}
```

---

## 11. Testing

### 11.1 Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./tests/setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
	},
});
```

### 11.2 Testing Library

```tsx
// src/components/ui/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
	it('renders correctly', () => {
		render(<Button>Click me</Button>);
		expect(screen.getByRole('button')).toHaveTextContent('Click me');
	});

	it('handles click events', () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);
		fireEvent.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('applies variant styles', () => {
		render(<Button variant="destructive">Delete</Button>);
		expect(screen.getByRole('button')).toHaveClass('bg-destructive');
	});
});
```

### 11.3 E2E con Playwright

```typescript
// tests/e2e/gallery.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Gallery', () => {
	test('should display images', async ({ page }) => {
		await page.goto('/folders/123');
		await expect(page.locator('[data-testid="image-card"]')).toHaveCount.greaterThan(0);
	});

	test('should open viewer on click', async ({ page }) => {
		await page.goto('/folders/123');
		await page.locator('[data-testid="image-card"]').first().click();
		await expect(page.locator('[data-testid="file-viewer"]')).toBeVisible();
	});
});
```

---

## 12. Performance

### 12.1 Memoización

```tsx
// Memoizar componentes pesados
const ImageCard = memo(function ImageCard({ image, onClick }) {
	return (
		<div onClick={onClick}>
			<img src={image.thumbnail} alt={image.name} loading="lazy" />
			<p>{image.name}</p>
		</div>
	);
});

// Memoizar callbacks
function Gallery({ images }) {
	const handleClick = useCallback((image) => {
		openViewer(image);
	}, []);

	return images.map((image) => <ImageCard key={image.id} image={image} onClick={() => handleClick(image)} />);
}
```

### 12.2 Code Splitting

```tsx
// Cargar componentes bajo demanda
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
	return (
		<Suspense fallback={<Skeleton />}>
			<HeavyComponent />
		</Suspense>
	);
}
```

### 12.3 Imágenes Optimizadas

```tsx
// Lazy loading de imágenes
function OptimizedImage({ src, alt }) {
	return <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full h-auto" />;
}
```

---

## 13. Buenas Prácticas

### 13.1 Convenciones de Naming

```
components/
├── my-component.tsx        # Componente
├── my-component.test.tsx   # Tests
├── my-component.stories.tsx # Storybook (opcional)
└── index.ts                # Exportaciones

hooks/
├── use-my-hook.ts          # Hook personalizado
└── use-my-hook.test.ts     # Tests
```

### 13.2 Patrones de Componente

```tsx
// Componente bien estructurado
import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
	variant?: 'default' | 'primary';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	children: React.ReactNode;
}

export const MyComponent = memo(
	forwardRef<HTMLDivElement, MyComponentProps>(
		({ variant = 'default', size = 'md', className, children, ...props }, ref) => {
			return (
				<div ref={ref} className={cn('base-styles', variants[variant], sizes[size], className)} {...props}>
					{children}
				</div>
			);
		}
	)
);

MyComponent.displayName = 'MyComponent';
```

### 13.3 Error Boundaries

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('Error boundary caught:', error, info);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}
```

---

## Referencias

- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Referencia de API](./API-REFERENCE.md)
- [Guía de Servicios](./SERVICES-GUIDE.md)
- [React Documentation](https://react.dev)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs)
