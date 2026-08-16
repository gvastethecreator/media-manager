import { memo, useMemo } from 'react';
import { EntityList } from '@/components/ui/entity-list';
import type { NavigationData } from '@/lib/api/navigation';
import type { AnyEntityWithStats } from '@/types/entities';

interface EntityCardsContentViewProps {
	data: NavigationData | undefined;
	error: Error | null;
	isError: boolean;
	isLoading: boolean;
}

const EntityCardsContentView: React.FC<EntityCardsContentViewProps> = memo(function EntityCardsContentView({
	data,
	isLoading,
	isError,
	error,
}) {
	if (isLoading) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center p-6">
				<p className="text-muted-foreground">Loading entity data...</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center p-6">
				<p className="text-destructive">Error loading data: {error?.message}</p>
			</div>
		);
	}

	// Mapear NavigationData (resumen) a entidades displayables con entityType para EntityCard
	const sections = useMemo(() => {
		if (!data) return [] as Array<{ key: string; title: string; items: AnyEntityWithStats[] }>;

		const mapFolders = (data.folders || []).map((f) => ({
			id: f.id,
			name: f.name,
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			entityType: 'folder' as const,
			path: f.path,
			stats: {
				imageCount: 0,
				videoCount: 0,
				albumCount: 0,
				collectionCount: 0,
				tagCount: 0,
				characterCount: 0,
				placeCount: 0,
				worldItemCount: 0,
				conceptCount: 0,
				promptCount: 0,
				noteCount: 0,
				wildcardCount: 0,
				propertyCount: 0,
				groupCount: 0,
				totalItems: f.itemCount ?? 0,
				totalAssociations: 0,
				lastUpdated: new Date(),
				size: 0,
				mtime: new Date(),
				birthtime: new Date(),
				type: 'folder',
			},
			_count: { images: 0, videos: 0 },
		})) as unknown as AnyEntityWithStats[];

		const mapCollections = (data.collections || []).map((c) => ({
			id: c.id,
			name: c.name,
			description: c.description ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
			entityType: 'collection' as const,
			stats: {
				imageCount: 0,
				videoCount: 0,
				albumCount: 0,
				collectionCount: 0,
				tagCount: 0,
				characterCount: 0,
				placeCount: 0,
				worldItemCount: 0,
				conceptCount: 0,
				promptCount: 0,
				noteCount: 0,
				wildcardCount: 0,
				propertyCount: 0,
				groupCount: 0,
				totalItems: c.itemCount ?? 0,
				totalAssociations: 0,
				lastUpdated: new Date(),
				size: 0,
				mtime: new Date(),
				birthtime: new Date(),
				type: 'collection',
			},
		})) as unknown as AnyEntityWithStats[];

		const mapTags = (data.tags || []).map((t) => ({
			id: t.id,
			name: t.name,
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			entityType: 'tag' as const,
			stats: {
				imageCount: 0,
				videoCount: 0,
				albumCount: 0,
				collectionCount: 0,
				tagCount: 0,
				characterCount: 0,
				placeCount: 0,
				worldItemCount: 0,
				conceptCount: 0,
				promptCount: 0,
				noteCount: 0,
				wildcardCount: 0,
				propertyCount: 0,
				groupCount: 0,
				totalItems: t.count ?? 0,
				totalAssociations: 0,
				lastUpdated: new Date(),
				size: 0,
				mtime: new Date(),
				birthtime: new Date(),
				type: 'tag',
			},
			_count: { images: t.count ?? 0 },
		})) as unknown as AnyEntityWithStats[];

		const mapPlaces = (data.places || []).map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
			entityType: 'place' as const,
			stats: {
				imageCount: 0,
				videoCount: 0,
				albumCount: 0,
				collectionCount: 0,
				tagCount: 0,
				characterCount: 0,
				placeCount: 0,
				worldItemCount: 0,
				conceptCount: 0,
				promptCount: 0,
				noteCount: 0,
				wildcardCount: 0,
				propertyCount: 0,
				groupCount: 0,
				totalItems: 0,
				totalAssociations: 0,
				lastUpdated: new Date(),
				size: 0,
				mtime: new Date(),
				birthtime: new Date(),
				type: 'place',
			},
		})) as unknown as AnyEntityWithStats[];

		const mapWorldItems = (data.worldItems || []).map((w) => ({
			id: w.id,
			name: w.name,
			description: w.description ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
			entityType: 'world-item' as const,
			stats: {
				imageCount: 0,
				videoCount: 0,
				albumCount: 0,
				collectionCount: 0,
				tagCount: 0,
				characterCount: 0,
				placeCount: 0,
				worldItemCount: 0,
				conceptCount: 0,
				promptCount: 0,
				noteCount: 0,
				wildcardCount: 0,
				propertyCount: 0,
				groupCount: 0,
				totalItems: 0,
				totalAssociations: 0,
				lastUpdated: new Date(),
				size: 0,
				mtime: new Date(),
				birthtime: new Date(),
				type: 'world-item',
			},
		})) as unknown as AnyEntityWithStats[];

		return [
			{ key: 'folders', title: `Folders (${mapFolders.length})`, items: mapFolders },
			{ key: 'collections', title: `Collections (${mapCollections.length})`, items: mapCollections },
			{ key: 'tags', title: `Tags (${mapTags.length})`, items: mapTags },
			{ key: 'places', title: `Places (${mapPlaces.length})`, items: mapPlaces },
			{ key: 'world-items', title: `World Items (${mapWorldItems.length})`, items: mapWorldItems },
		].filter((s) => s.items.length > 0);
	}, [data]);

	return (
		<div className="flex h-full w-full flex-col gap-8 p-6">
			<h2 className="font-bold text-2xl">🃏 Entity Cards</h2>
			{sections.length === 0 ? (
				<div className="rounded-lg bg-card p-6 text-muted-foreground shadow">No hay entidades para mostrar.</div>
			) : (
				sections.map((section) => (
					<section className="space-y-4" key={section.key}>
						<h3 className="font-semibold text-xl">{section.title}</h3>
						<EntityList
							allowViewChange={true}
							className="mt-2"
							description={undefined}
							items={section.items as unknown as any[]}
							pagination={section.items.length > 9}
							showFilters={false}
							showSearch={section.items.length > 8}
							title={undefined}
							viewType="grid"
						/>
					</section>
				))
			)}
		</div>
	);
});

export default EntityCardsContentView;
