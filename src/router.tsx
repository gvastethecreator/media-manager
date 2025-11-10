import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, useParams } from 'react-router-dom';
import { HierarchicalFolderWrapper } from '@/components/features/file-browser/wrappers/hierarchical-folder-wrapper';
import { MainLayout } from '@/components/layout/main-layout';
import ReindexLogsViewer from '@/components/settings/folders/reindex-logs-viewer';

// ✅ EAGER LOAD: Solo Dashboard y FolderContentView (rutas más usadas)
import Dashboard from '@/components/views/dashboard/dashboard';
import { FolderContentView } from '@/components/views/folders/folder-content-view';

// ✅ LAZY LOAD: Todas las demás vistas (optimización de bundle -800KB ~28%)
const AllImagesView = lazy(() => import('@/components/views/all-images/all-images-view').then(m => ({ default: m.AllImagesView })));
const AudioView = lazy(() => import('@/components/views/audio/audio-view'));
const DevelopmentContentView = lazy(() => import('@/components/views/development/development-content-view'));
const DocumentsView = lazy(() => import('@/components/views/documents/documents-view'));
const EntityCardsView = lazy(() => import('@/components/views/entity-cards').then(m => ({ default: m.EntityCardsView })));
const File3DDetailView = lazy(() => import('@/components/views/file3d/file-3d-content-view').then(m => ({ default: m.File3DContentView })));
const File3DView = lazy(() => import('@/components/views/file3d/file3d-view'));
const AllFilesView = lazy(() => import('@/components/views/files/all-files-view').then(m => ({ default: m.AllFilesView })));
const FoldersView = lazy(() => import('@/components/views/folders/folders-view'));
const ImageDetailView = lazy(() => import('@/components/views/images/image-detail-view'));
const JsonFileContentView = lazy(() => import('@/components/views/json-files/json-file-content-view').then(m => ({ default: m.JsonFileContentView })));
const JsonFilesView = lazy(() => import('@/components/views/json-files/json-files-view'));
const MixedContentView = lazy(() => import('@/components/views/mixed/mixed-content-view'));
const NotesViewSimple = lazy(() => import('@/components/views/notes/notes-view-simple'));
const PlaceContentView = lazy(() => import('@/components/views/places/place-content-view').then(m => ({ default: m.PlaceContentView })));
const PlacesView = lazy(() => import('@/components/views/places/places-view').then(m => ({ default: m.PlacesView })));
const PromptsView = lazy(() => import('@/components/views/prompts/prompts-view').then(m => ({ default: m.PromptsView })));
const PropertiesView = lazy(() => import('@/components/views/properties/properties-view').then(m => ({ default: m.PropertiesView })));
const SearchView = lazy(() => import('@/components/views/search/search-view').then(m => ({ default: m.SearchView })));
const SettingsContentView = lazy(() => import('@/components/views/settings/settings-content-view'));
const TagContentView = lazy(() => import('@/components/views/tags/tag-content-view').then(m => ({ default: m.TagContentView })));
const TagsView = lazy(() => import('@/components/views/tags/tags-view').then(m => ({ default: m.TagsView })));
const VideosView = lazy(() => import('@/components/views/videos/videos-view'));
const WildcardsView = lazy(() => import('@/components/views/wildcards/wildcards-view').then(m => ({ default: m.WildcardsView })));
const WorldItemContentView = lazy(() => import('@/components/views/world-items/world-item-content-view').then(m => ({ default: m.WorldItemContentView })));
const WorldItemsView = lazy(() => import('@/components/views/world-items/world-items-view').then(m => ({ default: m.WorldItemsView })));

// ✅ VISTAS DE ENTIDADES ABSTRACTAS - Previamente con placeholder, ahora conectadas
const CharactersView = lazy(() => import('@/components/views/characters/characters-view'));
const ConceptsView = lazy(() => import('@/components/views/concepts/concepts-view'));
const CollectionsView = lazy(() => import('@/components/views/collections/collections-view'));
const AlbumsView = lazy(() => import('@/components/views/albums/albums-view'));
const FavoritesView = lazy(() => import('@/components/views/favorites/favorites-view'));
const GroupsView = lazy(() => import('@/components/views/groups/groups-view'));

// Wrapper components para pasar el parámetro de la URL
const FolderContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	return <FolderContentView folderId={id} />;
};

// Wrapper para las rutas de documentación (simplificado sin fumadocs)
const DocsWrapper = () => (
	<Suspense fallback={<div />}>
		<Outlet />
	</Suspense>
);

// Componente NotFound simple
const NotFoundPage = () => {
	return (
		<div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
			<div className="w-full max-w-md rounded-lg border border-red-200 p-6 text-center">
				<h1 className="mb-4 font-bold text-2xl text-red-800">Página no encontrada</h1>
				<p className="mb-4 text-red-600">La página que estás buscando no existe o ha sido movida.</p>
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
				element: <Dashboard />,
			},
			// Rutas principales
			{
				path: 'settings',
				element: <SettingsContentView />,
			},
			{
				path: 'development',
				element: <DevelopmentContentView />,
			},
			// Carpetas y archivos
			{
				path: 'folders',
				element: <FoldersView />,
			},
			{
				path: 'folders/*',
				element: <HierarchicalFolderWrapper />,
			},
			{
				path: 'all-files',
				element: <AllFilesView className="h-full" />,
			},
			{
				path: 'all-images',
				element: <AllImagesView className="h-full" />,
			},
			// Multimedia
			{
				path: 'videos',
				element: <VideosView className="h-full" />,
			},
			// Multimedia - Temporalmente simplificados
			{
				path: 'audios',
				element: <AudioView className="h-full" />,
			},
			{
				path: 'documents',
				element: <DocumentsView className="h-full" />,
			},
			{
				path: 'json-files',
				element: <JsonFilesView className="h-full" />,
			},
			{
				path: 'file-3ds',
				element: <File3DView className="h-full" />,
			},
			// Organizadores
			{
				path: 'favorites',
				element: <FavoritesView />,
			},
			{
				path: 'collections',
				element: <CollectionsView />,
			},
			{
				path: 'albums',
				element: <AlbumsView />,
			},
			{
				path: 'groups',
				element: <GroupsView />,
			},
			{
				path: 'tags',
				element: <TagsView />,
			},
			// Contenido de Tag
			{
				path: 'tag-content',
				element: <TagContentView />,
			},
			{
				path: 'tags/:id',
				element: <TagContentView />,
			},
			// Worldbuilding
			{
				path: 'characters',
				element: <CharactersView />,
			},
			{
				path: 'places',
				element: <PlacesView className="h-full" />,
			},
			// Contenido de Place
			{
				path: 'place-content',
				element: <PlaceContentView />,
			},
			{
				path: 'places/:id',
				element: <PlaceContentView />,
			},
			{
				path: 'world-items',
				element: <WorldItemsView className="h-full" />,
			},
			// Contenido de World Item
			{
				path: 'world-item-content',
				element: <WorldItemContentView />,
			},
			{
				path: 'world-items/:id',
				element: <WorldItemContentView />,
			},
			{
				path: 'concepts',
				element: <ConceptsView />,
			},
			{
				path: 'wildcards',
				element: <WildcardsView className="h-full" />,
			},
			{
				path: 'workflows',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Workflows</h2>
						<p className="text-muted-foreground">Vista de workflows en desarrollo...</p>
					</div>
				),
			},
			// Gestión
			{
				path: 'prompts',
				element: <PromptsView className="h-full" />,
			},
			{
				path: 'notes',
				element: <NotesViewSimple className="h-full" />,
			},
			{
				path: 'properties',
				element: <PropertiesView className="h-full" />,
			},
			// Utilidades
			{
				path: 'search',
				element: <SearchView className="h-full" />,
			},
			{
				path: 'entity-cards',
				element: <EntityCardsView />,
			},
			{
				path: 'mixed',
				element: <MixedContentView />,
			},
			// Content Views - Vistas de detalle con parámetros
			// TODO: Re-implementar wrappers para vistas de detalle
			// {
			//	path: 'albums/:id',
			//	element: <AlbumContentWrapper />,
			// },
			// Rutas para imágenes individuales
			{
				path: 'images/:id',
				element: <ImageDetailView />,
			},
			// Content Views - Vistas de detalle pendientes de implementación
			// TODO: Implementar DocumentContentView y AudioContentView
			{
				path: 'document-content',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Contenido de Documento</h2>
						<p className="text-muted-foreground">Vista pendiente de implementación</p>
					</div>
				),
			},
			{
				path: 'audio-content',
				element: (
					<div className="p-6">
						<h2 className="font-bold text-2xl">Contenido de Audio</h2>
						<p className="text-muted-foreground">Vista pendiente de implementación</p>
					</div>
				),
			},
			{
				path: 'json-file-content',
				element: <JsonFileContentView />,
			},
			{
				path: 'file-3d-content',
				element: <File3DDetailView />,
			},
			{
				path: 'admin/reindex',
				element: <ReindexLogsViewer />,
			},
		],
	},

	{
		path: '*',
		element: <NotFoundPage />,
	},
]);
