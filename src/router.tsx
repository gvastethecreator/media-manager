import { Suspense, lazy } from 'react';
import { createBrowserRouter, useParams } from 'react-router-dom';
import { HierarchicalFolderWrapper } from '@/components/features/file-browser/wrappers/hierarchical-folder-wrapper';
import { MainLayout } from '@/components/layout/main-layout';
const AllImagesView = lazy(() => import('@/components/views/all-images/all-images-view').then((m) => ({ default: m.AllImagesView })));
const AudioView = lazy(() => import('@/components/views/audio/audio-view'));
const Dashboard = lazy(() => import('@/components/views/dashboard/dashboard'));
const DevelopmentContentView = lazy(() => import('@/components/views/development/development-content-view'));
const DocumentsView = lazy(() => import('@/components/views/documents/documents-view'));
const EntityCardsView = lazy(() => import('@/components/views/entity-cards').then((m) => ({ default: m.EntityCardsView })));
const File3DDetailView = lazy(() => import('@/components/views/file3d/file-3d-content-view').then((m) => ({ default: m.File3DContentView })));
const File3DView = lazy(() => import('@/components/views/file3d/file3d-view'));
const AllFilesView = lazy(() => import('@/components/views/files/all-files-view').then((m) => ({ default: m.AllFilesView })));
const FolderContentView = lazy(() => import('@/components/views/folders/folder-content-view').then((m) => ({ default: m.FolderContentView })));
const FoldersView = lazy(() => import('@/components/views/folders/folders-view'));
const ImageDetailView = lazy(() => import('@/components/views/images/image-detail-view'));
const JsonFileContentView = lazy(() => import('@/components/views/json-files/json-file-content-view').then((m) => ({ default: m.JsonFileContentView })));
const JsonFilesView = lazy(() => import('@/components/views/json-files/json-files-view'));
const MixedContentView = lazy(() => import('@/components/views/mixed/mixed-content-view'));
const NotesViewSimple = lazy(() => import('@/components/views/notes/notes-view-simple'));
const PlaceContentView = lazy(() => import('@/components/views/places/place-content-view').then((m) => ({ default: m.PlaceContentView })));
const PlacesView = lazy(() => import('@/components/views/places/places-view').then((m) => ({ default: m.PlacesView })));
const PromptsView = lazy(() => import('@/components/views/prompts/prompts-view').then((m) => ({ default: m.PromptsView })));
const PropertiesView = lazy(() => import('@/components/views/properties/properties-view').then((m) => ({ default: m.PropertiesView })));
const SearchView = lazy(() => import('@/components/views/search/search-view').then((m) => ({ default: m.SearchView })));
const SettingsContentView = lazy(() => import('@/components/views/settings/settings-content-view'));
const TagContentView = lazy(() => import('@/components/views/tags/tag-content-view').then((m) => ({ default: m.TagContentView })));
const TagsView = lazy(() => import('@/components/views/tags/tags-view').then((m) => ({ default: m.TagsView })));
const VideosView = lazy(() => import('@/components/views/videos/videos-view'));
const WildcardsView = lazy(() => import('@/components/views/wildcards/wildcards-view').then((m) => ({ default: m.WildcardsView })));
const WorldItemContentView = lazy(() => import('@/components/views/world-items/world-item-content-view').then((m) => ({ default: m.WorldItemContentView })));
const WorldItemsView = lazy(() => import('@/components/views/world-items/world-items-view').then((m) => ({ default: m.WorldItemsView })));
const ReindexLogsViewer = lazy(() => import('@/components/settings/folders/reindex-logs-viewer'));
// Wrapper components para pasar el parámetro de la URL
const RouteFallback = () => (
	<div className="flex h-full w-full items-center justify-center p-6 text-muted-foreground">
		Cargando…
	</div>
);

const withSuspense = (element: React.ReactElement) => <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
const FolderContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	return withSuspense(<FolderContentView folderId={id} />);
};

// Wrapper para las rutas de documentaciÃ³n (simplificado sin fumadocs)
// Importar stores para los wrappers

// Wrapper para CharactersView
const CharactersViewWrapper = () => {
	return (
		<div className="p-6">
			<h2 className="font-bold text-2xl">Vista de Personajes</h2>
			<p className="text-muted-foreground">Esta vista estÃ¡ siendo reparada...</p>
		</div>
	);
};

// Wrappers eliminados - TODO: Re-implementar cuando se necesiten
// const AlbumContentWrapper = () => ...
// const CharacterContentWrapper = () => ...
// etc.

// Componente NotFound simple
const NotFoundPage = () => {
	return (
		<div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
			<div className="w-full max-w-md rounded-lg border border-red-200 p-6 text-center">
				<h1 className="mb-4 font-bold text-2xl text-red-800">PÃ¡gina no encontrada</h1>
				<p className="mb-4 text-red-600">La pÃ¡gina que estÃ¡s buscando no existe o ha sido movida.</p>
				<a className="font-semibold text-red-700 hover:underline" href="/">
					Volver al inicio
				</a>
			</div>
		</div>
	);
};

export const router = createBrowserRouter([
	{
		path: '/',
		element: <MainLayout />,
		children: [
			// Ruta principal - Dashboard
			{
				index: true,
				element: withSuspense(<Dashboard />),
			},
			// Rutas principales
			{
				path: 'settings',
				element: withSuspense(<SettingsContentView />),
			},
			{
				path: 'development',
				element: withSuspense(<DevelopmentContentView />),
			},
			// Carpetas y archivos
			{
				path: 'folders',
				element: withSuspense(<FoldersView />),
			},
			{
				path: 'folders/*',
				element: <HierarchicalFolderWrapper />,
			},
			{
				path: 'all-files',
				element: withSuspense(<AllFilesView className="h-full" />),
			},
			{
				path: 'all-images',
				element: withSuspense(<AllImagesView className="h-full" />),
			},
			// Multimedia
			{
				path: 'videos',
				element: withSuspense(<VideosView className="h-full" />),
			},
			// Multimedia - Temporalmente simplificados
			{
				path: 'audios',
				element: withSuspense(<AudioView className="h-full" />),
			},
			{
				path: 'documents',
				element: withSuspense(<DocumentsView className="h-full" />),
			},
			{
				path: 'json-files',
				element: withSuspense(<JsonFilesView className="h-full" />),
			},
			{
				path: 'file-3ds',
				element: withSuspense(<File3DView className="h-full" />),
			},
			// Organizadores - Temporalmente simplificados
			{
				path: 'favorites',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Vista de Favoritos</h2>
						<p className="text-muted-foreground">Esta vista estÃ¡ siendo reparada...</p>
					</div>
				),
			},
			{
				path: 'collections',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Vista de Colecciones</h2>
						<p className="text-muted-foreground">Esta vista estÃ¡ siendo reparada...</p>
					</div>
				),
			},
			{
				path: 'albums',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Vista de Ãlbumes</h2>
						<p className="text-muted-foreground">Esta vista estÃ¡ siendo reparada...</p>
					</div>
				),
			},
			{
				path: 'groups',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Vista de Grupos</h2>
						<p className="text-muted-foreground">Esta vista estÃ¡ siendo reparada...</p>
					</div>
				),
			},
			{
				path: 'tags',
				element: withSuspense(<TagsView />),
			},
			// Contenido de Tag
			{
				path: 'tag-content',
				element: withSuspense(<TagContentView />),
			},
			{
				path: 'tags/:id',
				element: withSuspense(<TagContentView />),
			},
			// Worldbuilding
			{
				path: 'characters',
				element: <CharactersViewWrapper />,
			},
			{
				path: 'places',
				element: withSuspense(<PlacesView className="h-full" />),
			},
			// Contenido de Place
			{
				path: 'place-content',
				element: withSuspense(<PlaceContentView />),
			},
			{
				path: 'places/:id',
				element: withSuspense(<PlaceContentView />),
			},
			{
				path: 'world-items',
				element: withSuspense(<WorldItemsView className="h-full" />),
			},
			// Contenido de World Item
			{
				path: 'world-item-content',
				element: withSuspense(<WorldItemContentView />),
			},
			{
				path: 'world-items/:id',
				element: withSuspense(<WorldItemContentView />),
			},
			{
				path: 'concepts',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Vista de Conceptos</h2>
						<p className="text-muted-foreground">Esta vista estÃ¡ siendo reparada...</p>
					</div>
				),
			},
			{
				path: 'wildcards',
				element: withSuspense(<WildcardsView className="h-full" />),
			},
			// GestiÃ³n
			{
				path: 'prompts',
				element: withSuspense(<PromptsView className="h-full" />),
			},
			{
				path: 'notes',
				element: withSuspense(<NotesViewSimple className="h-full" />),
			},
			{
				path: 'properties',
				element: withSuspense(<PropertiesView className="h-full" />),
			},
			// Utilidades
			{
				path: 'search',
				element: withSuspense(<SearchView className="h-full" />),
			},
			{
				path: 'entity-cards',
				element: withSuspense(<EntityCardsView />),
			},
			{
				path: 'mixed',
				element: withSuspense(<MixedContentView />),
			},
			// Content Views - Vistas de detalle con parÃ¡metros
			// TODO: Re-implementar wrappers para vistas de detalle
			// {
			//	path: 'albums/:id',
			//	element: <AlbumContentWrapper />
			// },
			// Rutas para imÃ¡genes individuales
			{
				path: 'images/:id',
				element: withSuspense(<ImageDetailView />),
			},
			// Content Views - Vistas de detalle sin parÃ¡metros - Temporalmente simplificadas
			{
				path: 'document-content',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Contenido de Documento</h2>
						<p className="text-muted-foreground">Esta vista estÃ¡ siendo reparada...</p>
					</div>
				),
			},
			{
				path: 'audio-content',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Contenido de Audio</h2>
						<p className="text-muted-foreground">Esta vista estÃ¡ siendo reparada...</p>
					</div>
				),
			},
			{
				path: 'json-file-content',
				element: withSuspense(<JsonFileContentView />),
			},
			{
				path: 'file-3d-content',
				element: withSuspense(<File3DDetailView />),
			},
			{
				path: 'admin/reindex',
				element: withSuspense(<ReindexLogsViewer />),
			},
		],
	},

	{
		path: '*',
		element: <NotFoundPage />,
	},
]);

