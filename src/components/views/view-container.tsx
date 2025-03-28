'use client';

import { useNavigationStore } from '@/components/navigation/navigation.store';
import { SettingsView } from '@/components/settings/settings-view';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { memo } from 'react';
import CardDebugToolbar from '../features/entity-cards/debug/card-debug-toolbar';
import { EntityCardsView } from '../features/entity-cards/views/entity-cards-view';
import { FolderContentView } from '../folders/views/folder-content-view';
import { FoldersView } from '../folders/views/folders-view';
import { AlbumContentView } from './albums/album-content-view';
import { AlbumsView } from './albums/albums-view';
import { AllImagesView } from './all-images/all-images-view';
import { CharacterContentView } from './characters/character-content-view';
import { CharactersView } from './characters/characters-view';
import { CollectionContentView } from './collections/collection-content-view';
import { CollectionsView } from './collections/collections-view';
import { ConceptContentView } from './concepts/concept-content-view';
import { ConceptsView } from './concepts/concepts-view';
import { DevelopmentView } from './development/development-view';
import { FavoritesView } from './favorites/favorites-view';
import { NoteContentView } from './notes/note-content-view';
import { NotesView } from './notes/notes-view';
import { PlaceContentView } from './places/place-content-view';
import { PlacesView } from './places/places-view';
import { PromptContentView } from './prompts/prompt-content-view';
import { PromptsView } from './prompts/prompts-view';
import { SearchView } from './search/search-view';
import { TagContentView } from './tags/tag-content-view';
import { TagsView } from './tags/tags-view';
import type { ViewType } from './types';
import { UploadedImagesView } from './uploaded-images/uploaded-images-view';
import { WorldItemContentView } from './world-items/world-item-content-view';
import { WorldItemsView } from './world-items/world-items-view';

const variants = {
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
		case 'entity-cards':
			return <EntityCardsView />;
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

	return (
		<div className={cn('h-full flex flex-col')}>
			

			<AnimatePresence initial={false} custom={navigationDirection}>
				<motion.div
					key={currentView}
					custom={navigationDirection}
					variants={variants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{
						x: { type: 'spring', stiffness: 400, damping: 35 },
						opacity: { duration: 0.15 },
						scale: { duration: 0.2 },
					}}
					className="absolute inset-0 w-full h-full"
				>
					<MemoizedViewContent view={currentView} />
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
