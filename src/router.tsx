import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';

// Settings
const SettingsContentView = lazy(() =>
	import('@/components/views/settings/settings-content-view').then((m) => ({ default: m.SettingsContentView }))
);

const Dashboard = lazy(() => import('@/components/views/dashboard/dashboard'));
const FolderContentView = lazy(() =>
	import('@/components/views/folders/folder-content-view').then((m) => ({ default: m.FolderContentView }))
);
const HierarchicalFolderWrapper = lazy(() =>
	import('@/components/features/file-browser-new/wrappers/hierarchical-folder-wrapper').then((m) => ({
		default: m.HierarchicalFolderWrapper,
	}))
);
const ReindexLogsViewer = lazy(() => import('@/components/settings/folders/reindex-logs-viewer'));

const AllImagesView = lazy(() =>
	import('@/components/views/all-images/all-images-view').then((m) => ({ default: m.AllImagesView }))
);
const AlbumsView = lazy(() => import('@/components/views/albums/albums-view').then((m) => ({ default: m.AlbumsView })));
const AudioView = lazy(() => import('@/components/views/audio/audio-view'));
const CharactersView = lazy(() =>
	import('@/components/views/characters/characters-view').then((m) => ({ default: m.CharactersView }))
);
const CollectionsView = lazy(() =>
	import('@/components/views/collections/collections-view').then((m) => ({ default: m.CollectionsView }))
);
const ConceptsView = lazy(() =>
	import('@/components/views/concepts/concepts-view').then((m) => ({ default: m.ConceptsView }))
);
const DevelopmentContentView = lazy(() => import('@/components/views/development/development-content-view'));
const DocumentsView = lazy(() => import('@/components/views/documents/documents-view'));
const EntityCardsView = lazy(() =>
	import('@/components/views/entity-cards/entity-cards-view').then((m) => ({ default: m.EntityCardsView }))
);
const FavoritesView = lazy(() =>
	import('@/components/views/favorites/favorites-view').then((m) => ({ default: m.FavoritesView }))
);
const File3DDetailView = lazy(() =>
	import('@/components/views/file3d/file-3d-content-view').then((m) => ({ default: m.File3DContentView }))
);
const File3DView = lazy(() => import('@/components/views/file3d/file3d-view'));
const AllFilesView = lazy(() =>
	import('@/components/views/files/all-files-view').then((m) => ({ default: m.AllFilesView }))
);
const FoldersView = lazy(() => import('@/components/views/folders/folders-view'));
const GroupsView = lazy(() => import('@/components/views/groups/groups-view').then((m) => ({ default: m.GroupsView })));
const ImageDetailView = lazy(() => import('@/components/views/images/image-detail-view'));
const JsonFileContentView = lazy(() =>
	import('@/components/views/json-files/json-file-content-view').then((m) => ({ default: m.JsonFileContentView }))
);
const JsonFilesView = lazy(() => import('@/components/views/json-files/json-files-view'));
const MixedContentView = lazy(() => import('@/components/views/mixed/mixed-content-view'));
const NotesView = lazy(() =>
	import('@/components/views/notes/notes-view').then((module) => ({ default: module.NotesView }))
);
const PlaceContentView = lazy(() =>
	import('@/components/views/places/place-content-view').then((m) => ({ default: m.PlaceContentView }))
);
const PlacesView = lazy(() => import('@/components/views/places/places-view').then((m) => ({ default: m.PlacesView })));
const PromptsView = lazy(() =>
	import('@/components/views/prompts/prompts-view').then((m) => ({ default: m.PromptsView }))
);
const PropertiesView = lazy(() =>
	import('@/components/views/properties/properties-view').then((m) => ({ default: m.PropertiesView }))
);
const PropertyContentView = lazy(() =>
	import('@/components/views/properties/property-content-view').then((m) => ({ default: m.PropertyContentView }))
);
const SearchView = lazy(() => import('@/components/views/search/search-view').then((m) => ({ default: m.SearchView })));
const TagContentView = lazy(() =>
	import('@/components/views/tags/tag-content-view').then((m) => ({ default: m.TagContentView }))
);
const TagsView = lazy(() => import('@/components/views/tags/tags-view').then((m) => ({ default: m.TagsView })));
const VideosView = lazy(() => import('@/components/views/videos/videos-view'));
const WildcardsView = lazy(() =>
	import('@/components/views/wildcards/wildcards-view').then((m) => ({ default: m.WildcardsView }))
);
const WorldItemContentView = lazy(() =>
	import('@/components/views/world-items/world-item-content-view').then((m) => ({ default: m.WorldItemContentView }))
);
const WorldItemsView = lazy(() =>
	import('@/components/views/world-items/world-items-view').then((m) => ({ default: m.WorldItemsView }))
);
// Content Views para detalle
const AlbumContentView = lazy(() =>
	import('@/components/views/albums/album-content-view').then((m) => ({ default: m.AlbumContentView }))
);
const CharacterContentView = lazy(() =>
	import('@/components/views/characters/character-content-view').then((m) => ({ default: m.CharacterContentView }))
);
const CollectionContentView = lazy(() =>
	import('@/components/views/collections/collection-content-view').then((m) => ({ default: m.CollectionContentView }))
);
const ConceptContentView = lazy(() =>
	import('@/components/views/concepts/concept-content-view').then((m) => ({ default: m.ConceptContentView }))
);
const GroupContentView = lazy(() =>
	import('@/components/views/groups/group-content-view').then((m) => ({ default: m.GroupContentView }))
);
const WildcardContentView = lazy(() =>
	import('@/components/views/wildcards/wildcard-content-view').then((m) => ({ default: m.WildcardContentView }))
);
const PromptContentView = lazy(() =>
	import('@/components/views/prompts/prompt-content-view').then((m) => ({ default: m.PromptContentView }))
);

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
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md rounded-lg border border-destructive/20 bg-card p-6 text-center">
				<h1 className="mb-4 font-bold text-2xl text-destructive">Página no encontrada</h1>
				<p className="mb-4 text-destructive">La página que estás buscando no existe o ha sido movida.</p>
				<a className="font-semibold text-destructive hover:underline" href="/">
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
				path: 'audio',
				element: <AudioView className="h-full" />,
			},
			// Organización
			{
				path: 'favorites',
				element: <FavoritesView className="h-full" />,
			},
			{
				path: 'collections',
				element: <CollectionsView className="h-full" />,
			},
			{
				path: 'collection-content',
				element: <CollectionContentView />,
			},
			{
				path: 'collections/:id',
				element: <CollectionContentView />,
			},
			{
				path: 'albums',
				element: <AlbumsView className="h-full" />,
			},
			{
				path: 'album-content',
				element: <AlbumContentView />,
			},
			{
				path: 'albums/:id',
				element: <AlbumContentView />,
			},
			{
				path: 'groups',
				element: <GroupsView className="h-full" />,
			},
			{
				path: 'group-content',
				element: <GroupContentView />,
			},
			{
				path: 'groups/:id',
				element: <GroupContentView />,
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
				element: <CharactersView className="h-full" />,
			},
			{
				path: 'character-content',
				element: <CharacterContentView />,
			},
			{
				path: 'characters/:id',
				element: <CharacterContentView />,
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
				element: <ConceptsView className="h-full" />,
			},
			{
				path: 'concept-content',
				element: <ConceptContentView />,
			},
			{
				path: 'concepts/:id',
				element: <ConceptContentView />,
			},
			{
				path: 'wildcards',
				element: <WildcardsView className="h-full" />,
			},
			{
				path: 'wildcard-content',
				element: <WildcardContentView />,
			},
			{
				path: 'wildcards/:id',
				element: <WildcardContentView />,
			},
			{
				path: 'prompts',
				element: <PromptsView className="h-full" />,
			},
			{
				path: 'prompt-content',
				element: <PromptContentView />,
			},
			{
				path: 'prompts/:id',
				element: <PromptContentView />,
			},
			{
				path: 'notes',
				element: <NotesView className="h-full" />,
			},
			{
				path: 'documents',
				element: <DocumentsView className="h-full" />,
			},
			{
				path: 'file3d',
				element: <File3DView className="h-full" />,
			},
			{
				path: 'file3d/:id',
				element: <File3DDetailView />,
			},
			{
				path: 'json-files',
				element: <JsonFilesView className="h-full" />,
			},
			{
				path: 'json-files/:id',
				element: <JsonFileContentView />,
			},
			{
				path: 'mixed',
				element: <MixedContentView />,
			},
			{
				path: 'entity-cards',
				element: <EntityCardsView />,
			},
			{
				path: 'properties',
				element: <PropertiesView className="h-full" />,
			},
			{
				path: 'properties/:id',
				element: <PropertyContentView />,
			},
			{
				path: 'search',
				element: <SearchView className="h-full" />,
			},
			{
				path: 'images/:id',
				element: <ImageDetailView />,
			},
			// Sistema
			{
				path: 'settings',
				element: <SettingsContentView />,
			},
			{
				path: 'reindex-logs',
				element: <ReindexLogsViewer />,
			},
			// 404 Not Found
			{
				path: '*',
				element: <NotFoundPage />,
			},
		],
	},
]);
