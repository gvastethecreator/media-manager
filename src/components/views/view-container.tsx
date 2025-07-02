import { useNavigationStore } from '@/components/navigation/navigation.store';
import { SettingsView } from '@/components/settings/settings-view';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useState } from 'react';
import { EntityPreloader } from '../features/file-browser/entity-preloader';
import { AlbumContentView } from './albums/album-content-view';
import { AlbumsView } from './albums/albums-view';
import { AllImagesView } from './all-images/all-images-view';
import { AudioView } from './audio/audio-view';
import { CharacterContentView } from './characters/character-content-view';
import { CharactersView } from './characters/characters-view';
import { CollectionContentView } from './collections/collection-content-view';
import { CollectionsView } from './collections/collections-view';
import { ConceptContentView } from './concepts/concept-content-view';
import { ConceptsView } from './concepts/concepts-view';
import { DevelopmentView } from './development/development-view';
import { DocumentsView } from './documents/documents-view';
import { FavoritesView } from './favorites/favorites-view';
import { File3DView } from './file3d/file3d-view';
import { FolderContentView } from './folders/views/folder-content-view';
import { FoldersView } from './folders/views/folders-view';
import { GroupContentView } from './groups/group-content-view';
import { GroupsView } from './groups/groups-view';
import { JsonFilesView } from './json-files/json-files-view';
import { NoteContentView } from './notes/note-content-view';
import { NotesView } from './notes/notes-view';
import { PlaceContentView } from './places/place-content-view';
import { PlacesView } from './places/places-view';
import { PromptContentView } from './prompts/prompt-content-view';
import { PromptsView } from './prompts/prompts-view';
import { PropertiesView } from './properties/properties-view';
import { PropertyContentView } from './properties/property-content-view';
import { SearchView } from './search/search-view';
import { TagContentView } from './tags/tag-content-view';
import { TagsView } from './tags/tags-view';
import { ViewType } from './types';
import { UploadedImagesView } from './uploaded-images/uploaded-images-view';
import { WildcardContentView } from './wildcards/wildcard-content-view';
import { WildcardsView } from './wildcards/wildcards-view';
import { WorkflowsView } from './workflows/workflows-view';
import { WorldItemContentView } from './world-items/world-item-content-view';
import { WorldItemsView } from './world-items/world-items-view';

const _variants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 800 : -800,
		opacity: 0,
		scale: 0.98,
	}),
	center: {
		zIndex: 1,
		x: 0,
		opacity: 1,
		scale: 1,
	},
	exit: (direction: number) => ({
		zIndex: 0,
		x: direction < 0 ? 800 : -800,
		opacity: 0,
		scale: 0.98,
	}),
};

// Componente de vista con memorización para evitar renders innecesarios
const MemoizedViewContent = memo(({ view }: { view: ViewType }) => {
	switch (view) {
		case 'settings':
			return <SettingsView />;
		case 'all-images':
			return <AllImagesView />;
		case 'files':
			return <UploadedImagesView />;
		case 'favorites':
			return <FavoritesView />;
		case 'search':
			return <SearchView />;
		case 'collections':
			return <CollectionsView />;
		case 'collection-content':
			return <CollectionContentView />;
		case 'folders':
			return <FoldersView />;
		case 'folder-content':
			return <FolderContentView />;
		case 'canvas':
			return <FoldersView />;
		case 'chat':
			return <FoldersView />;
		case 'tags':
			return <TagsView />;
		case 'tag-content':
			return <TagContentView />;
		case 'albums':
			return <AlbumsView />;
		case 'album-content':
			return <AlbumContentView />;
		case 'characters':
			return <CharactersView />;
		case 'character-content':
			return <CharacterContentView />;
		case 'places':
			return <PlacesView />;
		case 'place-content':
			return <PlaceContentView />;
		case 'world-items':
			return <WorldItemsView />;
		case 'world-item-content':
			return <WorldItemContentView />;
		case 'concepts':
			return <ConceptsView />;
		case 'concept-content':
			return <ConceptContentView />;
		case 'prompts':
			return <PromptsView />;
		case 'prompt-content':
			return <PromptContentView />;
		case 'notes':
			return <NotesView />;
		case 'note-content':
			return <NoteContentView />;
		case 'groups':
			return <GroupsView />;
		case 'group-content':
			return <GroupContentView />;
		case 'properties':
			return <PropertiesView />;
		case 'property-content':
			return <PropertyContentView />;
		case 'wildcards':
			return <WildcardsView />;
		case 'wildcard-content':
			return <WildcardContentView />;
		case 'document':
			return <DocumentsView />;
		case 'json-file':
			return <JsonFilesView />;
		case 'audio':
			return <AudioView />;
		case 'file3d':
			return <File3DView />;
		case 'workflow':
			return <WorkflowsView />;
		default:
			return <DevelopmentView />;
	}
});

MemoizedViewContent.displayName = 'MemoizedViewContent';

interface ViewContainerProps {
	isResizing?: boolean;
}

export function ViewContainer({ isResizing }: ViewContainerProps) {
	const { currentView, navigationDirection } = useNavigationStore();
	// Usar una variable estática para controlar el montaje único del preloader
	const [hasInitialized, setHasInitialized] = useState(false);

	// Efecto que se ejecuta solo una vez al montar el componente
	useEffect(() => {
		// Si ya se ha inicializado globalmente, no hacer nada
		if (typeof window !== 'undefined' && window.entityPreloadComplete) {
			setHasInitialized(true);
			return;
		}

		// Si no está inicializado, proceder con la inicialización
		if (!hasInitialized) {
			setHasInitialized(true);
		}
	}, []); // Sin dependencias para que se ejecute solo una vez

	return (
		<div className="h-full w-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
			{/* Solo montar el EntityPreloader si no se ha inicializado globalmente */}
			{!hasInitialized && typeof window !== 'undefined' && !window.entityPreloadComplete && (
				<EntityPreloader
					mode="all"
					respectGlobalState={false}
					onPreloadComplete={() => {
						setHasInitialized(true);
					}}
				/>
			)}

			<AnimatePresence mode="wait">
				<motion.div
					key={currentView}
					className="h-full w-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden view-container-transition"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.18 }}
				>
					<MemoizedViewContent view={currentView} />
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
