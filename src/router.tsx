import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy loading de componentes principales existentes
const FoldersView = lazy(() =>
	import('@/components/views/folders/views/folders-view').then((m) => ({ default: m.FoldersView }))
);
const FolderContentView = lazy(() =>
	import('@/components/views/folders/views/folder-content-view').then((m) => ({ default: m.FolderContentView }))
);
const DatabaseDiagnostics = lazy(() =>
	import('@/components/views/folders/diagnostics/folder-diagnostics').then((m) => ({ default: m.FolderDiagnostics }))
);
const TestFoldersPage = lazy(() =>
	import('@/components/settings/folders/folders-settings').then((m) => ({ default: m.FoldersSettings }))
);
const DebugMainPage = lazy(() => import('./pages/debug/debug-main-page'));

// Componente wrapper para lazy loading
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
	<Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

// Componente Home que renderiza MainLayout
const HomePage = () => (
	<div className="h-screen w-full overflow-hidden bg-black">
		<MainLayout />
	</div>
);

// Componente NotFound
const NotFoundPage = () => {
	return (
		<div className="flex items-center justify-center min-h-screen bg-background/80 p-4">
			<div className="max-w-md w-full border rounded-lg p-6 text-center">
				<h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
				<p className="text-muted-foreground mb-4">La página que estás buscando no existe o ha sido movida.</p>
				<a href="/" className="text-primary hover:underline">
					Volver al inicio
				</a>
			</div>
		</div>
	);
};

// Layout para debug con navegación específica
const DebugPageLayout = ({ children }: { children: React.ReactNode }) => (
	<div className="flex min-h-screen flex-col">
		<div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
			<aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
				<div className="h-full py-6 pr-2 md:py-8">{/* Debug navigation component */}</div>
			</aside>
			<main className="flex w-full flex-col overflow-hidden py-6 md:py-8">{children}</main>
		</div>
	</div>
);

export const router = createBrowserRouter([
	{
		path: '/',
		element: <HomePage />,
		errorElement: <NotFoundPage />,
	},

	// Rutas de carpetas - usando componentes existentes
	{
		path: '/folders',
		element: (
			<LazyWrapper>
				<FoldersView />
			</LazyWrapper>
		),
	},
	{
		path: '/folders/:id',
		element: (
			<LazyWrapper>
				<FolderContentView />
			</LazyWrapper>
		),
	},

	// Ruta de test folders
	{
		path: '/test-folders',
		element: (
			<LazyWrapper>
				<div className="container mx-auto p-4">
					<h1 className="text-2xl font-bold mb-4">Prueba de Configuración de Carpetas</h1>
					<div className="max-w-md">
						<TestFoldersPage />
					</div>
				</div>
			</LazyWrapper>
		),
	},

	// Rutas de debug
	{
		path: '/debug',
		element: (
			<LazyWrapper>
				<DebugPageLayout>
					<DebugMainPage />
				</DebugPageLayout>
			</LazyWrapper>
		),
	},
	{
		path: '/debug/database',
		element: (
			<LazyWrapper>
				<DebugPageLayout>
					<DatabaseDiagnostics />
				</DebugPageLayout>
			</LazyWrapper>
		),
	},

	// Rutas de diagnósticos
	{
		path: '/diagnostics/database',
		element: (
			<LazyWrapper>
				<DatabaseDiagnostics />
			</LazyWrapper>
		),
	},

	// Ruta catch-all para páginas no encontradas
	{
		path: '*',
		element: <NotFoundPage />,
	},
]);
