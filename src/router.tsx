import { createBrowserRouter, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';
// Importar todas las vistas
import AlbumsContentView from '@/components/views/albums/albums-content-view';
import { AllImagesView } from '@/components/views/all-images/all-images-view';
import AudioContentView from '@/components/views/audio/audio-content-view';
import CharactersContentView from '@/components/views/characters/characters-content-view';
import CollectionsContentView from '@/components/views/collections/collections-content-view';
import ConceptsContentView from '@/components/views/concepts/concepts-content-view';
import DashboardContentView from '@/components/views/dashboard/dashboard-content-view';
import { DashboardView } from '@/components/views/dashboard/dashboard-view';
import DevelopmentContentView from '@/components/views/development/development-content-view';
import { DocumentContentView } from '@/components/views/documents/document-content-view';
import DocumentsContentView from '@/components/views/documents/documents-content-view';
import EntityCardsContentView from '@/components/views/entity-cards/entity-cards-content-view';
import FavoritesContentView from '@/components/views/favorites/favorites-content-view';
import { File3DContentView as File3DDetailView } from '@/components/views/file3d/file-3d-content-view';
import File3DContentView from '@/components/views/file3d/file3d-content-view';
import FilesContentView from '@/components/views/files/files-content-view';
import { FolderContentView } from '@/components/views/folders/folder-content-view';
import FoldersView from '@/components/views/folders/folders-view';
import GroupsContentView from '@/components/views/groups/groups-content-view';
import ImageDetailView from '@/components/views/images/image-detail-view';
import { JsonFileContentView } from '@/components/views/json-files/json-file-content-view';
import { JsonFilesView } from '@/components/views/json-files/json-files-view';
import MixedContentView from '@/components/views/mixed/mixed-content-view';
import { NotesView } from '@/components/views/notes/notes-view';
import { PlacesView } from '@/components/views/places/places-view';
import { PromptsView } from '@/components/views/prompts/prompts-view';
import { PropertiesView } from '@/components/views/properties/properties-view';
import { SearchView } from '@/components/views/search/search-view';
import SettingsContentView from '@/components/views/settings/settings-content-view';
import { TagsView } from '@/components/views/tags/tags-view';
import { UploadedImagesView } from '@/components/views/uploaded-images/uploaded-images-view';
import { WildcardsView } from '@/components/views/wildcards/wildcards-view';
import { WorkflowContentView } from '@/components/views/workflows/workflow-content-view';
import { WorkflowsView } from '@/components/views/workflows/workflows-view';
import { WorldItemsView } from '@/components/views/world-items/world-items-view';

// Wrapper components para pasar el parámetro de la URL
const FolderContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	return <FolderContentView folderId={id} />;
};

import { useEffect } from 'react';
// Importar las vistas de contenido específico
import { AlbumContentView } from '@/components/views/albums/album-content-view';
import { CharacterContentView } from '@/components/views/characters/character-content-view';
import { CollectionContentView } from '@/components/views/collections/collection-content-view';
import { ConceptContentView } from '@/components/views/concepts/concept-content-view';
import { GroupContentView } from '@/components/views/groups/group-content-view';
import { NoteContentView } from '@/components/views/notes/note-content-view';
import { PlaceContentView } from '@/components/views/places/place-content-view';
import { PromptContentView } from '@/components/views/prompts/prompt-content-view';
import { PropertyContentView } from '@/components/views/properties/property-content-view';
import { TagContentView } from '@/components/views/tags/tag-content-view';
import { WildcardContentView } from '@/components/views/wildcards/wildcard-content-view';
import { WorldItemContentView } from '@/components/views/world-items/world-item-content-view';
// Importar stores para los wrappers
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useGroupStore } from '@/store/entities/group';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { usePropertyStore } from '@/store/entities/property';
import { useTagStore } from '@/store/entities/tag';
import { useWildcardStore } from '@/store/entities/wildcard';
import { useWorldItemStore } from '@/store/entities/world-item';

// Wrapper para álbumes
const AlbumContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const { setCurrentAlbumId } = useAlbumStore();

	useEffect(() => {
		if (id) {
			setCurrentAlbumId(id);
		}
	}, [id, setCurrentAlbumId]);

	return <AlbumContentView />;
};

// Wrapper para personajes
const CharacterContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedCharacterId = useCharacterStore((state) => state.setSelectedCharacterId);

	useEffect(() => {
		if (id) {
			setSelectedCharacterId(id);
		}
	}, [id, setSelectedCharacterId]);

	return <CharacterContentView />;
};

// Wrapper para colecciones
const CollectionContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setCurrentCollectionId = useCollectionStore((state) => state.ui.setCurrentCollectionId);

	useEffect(() => {
		if (id) {
			setCurrentCollectionId(id);
		}
	}, [id, setCurrentCollectionId]);

	return <CollectionContentView />;
};

// Wrapper para conceptos
const ConceptContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedConceptId = useConceptStore((state) => state.setSelectedConceptId);

	useEffect(() => {
		if (id) {
			setSelectedConceptId(id);
		}
	}, [id, setSelectedConceptId]);

	return <ConceptContentView />;
};

// Wrapper para grupos
const GroupContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedGroupId = useGroupStore((state) => state.setSelectedGroupId);

	useEffect(() => {
		if (id) {
			setSelectedGroupId(id);
		}
	}, [id, setSelectedGroupId]);

	return <GroupContentView />;
};

// Wrapper para notas
const NoteContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedNoteId = useNoteStore((state) => state.setSelectedNoteId);

	useEffect(() => {
		if (id) {
			setSelectedNoteId(id);
		}
	}, [id, setSelectedNoteId]);

	return <NoteContentView />;
};

// Wrapper para lugares
const PlaceContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedPlaceId = usePlaceStore((state) => state.setSelectedPlaceId);

	useEffect(() => {
		if (id) {
			setSelectedPlaceId(id);
		}
	}, [id, setSelectedPlaceId]);

	return <PlaceContentView />;
};

// Wrapper para prompts
const PromptContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedPromptId = usePromptStore((state) => state.setSelectedPromptId);

	useEffect(() => {
		if (id) {
			setSelectedPromptId(id);
		}
	}, [id, setSelectedPromptId]);

	return <PromptContentView />;
};

// Wrapper para propiedades
const PropertyContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedPropertyId = usePropertyStore((state) => state.setSelectedPropertyId);

	useEffect(() => {
		if (id) {
			setSelectedPropertyId(id);
		}
	}, [id, setSelectedPropertyId]);

	return <PropertyContentView />;
};

// Wrapper para etiquetas
const TagContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedTagId = useTagStore((state) => state.setSelectedTagId);

	useEffect(() => {
		if (id) {
			setSelectedTagId(id);
		}
	}, [id, setSelectedTagId]);

	return <TagContentView />;
};

// Wrapper para wildcards
const WildcardContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedWildcardId = useWildcardStore((state) => state.setSelectedWildcardId);

	useEffect(() => {
		if (id) {
			setSelectedWildcardId(id);
		}
	}, [id, setSelectedWildcardId]);

	return <WildcardContentView />;
};

// Wrapper para world items
const WorldItemContentWrapper = () => {
	const { id } = useParams<{ id: string }>();
	const setSelectedWorldItemId = useWorldItemStore((state) => state.setSelectedWorldItemId);

	useEffect(() => {
		if (id) {
			setSelectedWorldItemId(id);
		}
	}, [id, setSelectedWorldItemId]);

	return <WorldItemContentView />;
};

// import { MainLayoutTest } from '@/components/layout/main-layout-test';
// import { MainLayoutSimpleNavPanel } from '@/components/layout/main-layout-simple-navpanel';

// Componente NotFound simple
const NotFoundPage = () => {
	return (
		<div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
			<div className="max-w-md w-full border border-red-200 rounded-lg p-6 text-center">
				<h1 className="text-2xl font-bold mb-4 text-red-800">Página no encontrada</h1>
				<p className="text-red-600 mb-4">La página que estás buscando no existe o ha sido movida.</p>
				<a href="/" className="text-red-700 hover:underline font-semibold">
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
			// Ruta principal
			{
				index: true,
				element: <DashboardContentView />,
			},
			// Rutas principales
			{
				path: 'dashboard',
				element: <DashboardContentView />,
			},
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
				path: 'folders/:id',
				element: <FolderContentWrapper />,
			},
			{
				path: 'files',
				element: <FilesContentView className="h-full" />,
			},
			{
				path: 'all-images',
				element: <AllImagesView className="h-full" />,
			},
			{
				path: 'uploaded-images',
				element: <UploadedImagesView />,
			},
			// Multimedia
			{
				path: 'audios',
				element: <AudioContentView className="h-full" />,
			},
			{
				path: 'documents',
				element: <DocumentsContentView className="h-full" />,
			},
			{
				path: 'json-files',
				element: <JsonFilesView className="h-full" />,
			},
			{
				path: 'workflows',
				element: <WorkflowsView />,
			},
			{
				path: 'file-3ds',
				element: <File3DContentView className="h-full" />,
			},
			// Organizadores
			{
				path: 'favorites',
				element: <FavoritesContentView className="h-full" />,
			},
			{
				path: 'collections',
				element: <CollectionsContentView className="h-full" />,
			},
			{
				path: 'albums',
				element: <AlbumsContentView className="h-full" />,
			},
			{
				path: 'groups',
				element: <GroupsContentView className="h-full" />,
			},
			{
				path: 'tags',
				element: <TagsView />,
			},
			// Worldbuilding
			{
				path: 'characters',
				element: <CharactersContentView className="h-full" />,
			},
			{
				path: 'places',
				element: <PlacesView className="h-full" />,
			},
			{
				path: 'world-items',
				element: <WorldItemsView className="h-full" />,
			},
			{
				path: 'concepts',
				element: <ConceptsContentView />,
			},
			{
				path: 'wildcards',
				element: <WildcardsView className="h-full" />,
			},
			// Gestión
			{
				path: 'prompts',
				element: <PromptsView className="h-full" />,
			},
			{
				path: 'notes',
				element: <NotesView className="h-full" />,
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
				element: <EntityCardsContentView />,
			},
			{
				path: 'mixed',
				element: <MixedContentView />,
			},
			// Content Views - Vistas de detalle con parámetros
			{
				path: 'albums/:id',
				element: <AlbumContentWrapper />,
			},
			{
				path: 'characters/:id',
				element: <CharacterContentWrapper />,
			},
			{
				path: 'collections/:id',
				element: <CollectionContentWrapper />,
			},
			{
				path: 'concepts/:id',
				element: <ConceptContentWrapper />,
			},
			{
				path: 'groups/:id',
				element: <GroupContentWrapper />,
			},
			{
				path: 'notes/:id',
				element: <NoteContentWrapper />,
			},
			{
				path: 'places/:id',
				element: <PlaceContentWrapper />,
			},
			{
				path: 'prompts/:id',
				element: <PromptContentWrapper />,
			},
			{
				path: 'properties/:id',
				element: <PropertyContentWrapper />,
			},
			{
				path: 'tags/:id',
				element: <TagContentWrapper />,
			},
			{
				path: 'wildcards/:id',
				element: <WildcardContentWrapper />,
			},
			{
				path: 'world-items/:id',
				element: <WorldItemContentWrapper />,
			},
			// Rutas para imágenes individuales
			{
				path: 'images/:id',
				element: <ImageDetailView />,
			},
			// Content Views - Vistas de detalle sin parámetros
			{
				path: 'document-content',
				element: <DocumentContentView />,
			},
			{
				path: 'audio-content',
				element: <AudioContentView />,
			},
			{
				path: 'json-file-content',
				element: <JsonFileContentView />,
			},
			{
				path: 'workflow-content',
				element: <WorkflowContentView />,
			},
			{
				path: 'file-3d-content',
				element: <File3DDetailView />,
			},
		],
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
]);
