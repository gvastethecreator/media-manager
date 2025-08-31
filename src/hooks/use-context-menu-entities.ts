import { useAlbums } from '@/lib/api/albums';
import { useCharacters } from '@/lib/api/characters';
import { useCollections } from '@/lib/api/collections';
import { useConcepts } from '@/lib/api/concepts';
import { useGroups } from '@/lib/api/groups';
import { useNotes } from '@/lib/api/notes';
import { usePlaces } from '@/lib/api/places';
import { usePrompts } from '@/lib/api/prompts';
import { useProperties } from '@/lib/api/properties';
import { useTags } from '@/lib/api/tags';
import { useWildcards } from '@/lib/api/wildcards';
import { useWorldItems } from '@/lib/api/world-items';

export interface EntityOption {
	id: string;
	name: string;
	icon?: string;
}

export interface ContextMenuEntities {
	albums: EntityOption[];
	collections: EntityOption[];
	groups: EntityOption[];
	tags: EntityOption[];
	worldItems: EntityOption[];
	characters: EntityOption[];
	concepts: EntityOption[];
	notes: EntityOption[];
	places: EntityOption[];
	prompts: EntityOption[];
	properties: EntityOption[];
	wildcards: EntityOption[];
}

// Helper function to convert entity with name to EntityOption
function toEntityOption<T extends { id: string; name: string; emoji?: string | null }>(entity: T): EntityOption {
	return {
		id: entity.id,
		name: entity.name,
		icon: entity.emoji || undefined,
	};
}

export function useContextMenuEntities() {
	// Fetch all entity types with minimal data (just for listing)
	const albumsQuery = useAlbums({ limit: 100 });
	const collectionsQuery = useCollections({ limit: 100 });
	const groupsQuery = useGroups({ limit: 100 });
	const tagsQuery = useTags({ limit: 100 });
	const worldItemsQuery = useWorldItems({ limit: 100 });
	const charactersQuery = useCharacters({ limit: 100 });
	const conceptsQuery = useConcepts({ limit: 100 });
	const notesQuery = useNotes({ limit: 100 });
	const placesQuery = usePlaces({ limit: 100 });
	const promptsQuery = usePrompts({ limit: 100 });
	const propertiesQuery = useProperties({ limit: 100 });
	const wildcardsQuery = useWildcards({ limit: 100 });

	const isLoading =
		albumsQuery.isLoading ||
		collectionsQuery.isLoading ||
		groupsQuery.isLoading ||
		tagsQuery.isLoading ||
		worldItemsQuery.isLoading ||
		charactersQuery.isLoading ||
		conceptsQuery.isLoading ||
		notesQuery.isLoading ||
		placesQuery.isLoading ||
		promptsQuery.isLoading ||
		propertiesQuery.isLoading ||
		wildcardsQuery.isLoading;

	const isError =
		albumsQuery.isError ||
		collectionsQuery.isError ||
		groupsQuery.isError ||
		tagsQuery.isError ||
		worldItemsQuery.isError ||
		charactersQuery.isError ||
		conceptsQuery.isError ||
		notesQuery.isError ||
		placesQuery.isError ||
		promptsQuery.isError ||
		propertiesQuery.isError ||
		wildcardsQuery.isError;

	const entities: ContextMenuEntities = {
		albums: albumsQuery.data?.data?.map(toEntityOption) || [],
		collections: collectionsQuery.data?.data?.map(toEntityOption) || [],
		groups: groupsQuery.data?.data?.map(toEntityOption) || [],
		tags: tagsQuery.data?.data?.map(toEntityOption) || [],
		worldItems: worldItemsQuery.data?.data?.map(toEntityOption) || [],
		characters: charactersQuery.data?.data?.map(toEntityOption) || [],
		concepts: conceptsQuery.data?.data?.map(toEntityOption) || [],
		notes: notesQuery.data?.data?.map(toEntityOption) || [],
		places: placesQuery.data?.data?.map(toEntityOption) || [],
		prompts: promptsQuery.data?.data?.map(toEntityOption) || [],
		properties: propertiesQuery.data?.data?.map(toEntityOption) || [],
		wildcards: wildcardsQuery.data?.data?.map(toEntityOption) || [],
	};

	return {
		entities,
		isLoading,
		isError,
		// Helper to check if a category has entities
		hasEntities: (category: keyof ContextMenuEntities) => entities[category].length > 0,
	};
}
