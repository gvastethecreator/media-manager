import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { toFileViewerItem } from '@/components/features/file-viewer/file-viewer-item';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/use-debounce';
import { useSearchUnified } from '@/lib/api/search';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { ViewProps } from '../types';

export function SearchView(_props: ViewProps) {
	const navigate = useNavigate();
	const [filters, setFilters] = useState({
		query: '',
		type: 'all' as 'all' | 'image' | 'video' | 'audio' | 'document',
	});
	const debouncedQuery = useDebounce(filters.query, 500);

	const {
		data: searchResponse,
		isLoading,
		error,
	} = useSearchUnified({
		query: debouncedQuery,
		type: filters.type,
		limit: 100,
	});

	const { openViewer } = useFileViewerStore();
	const { setSelectedItems, setVisible } = useDetailsPanel();

	const browserItems = useMemo(() => {
		if (!searchResponse?.results) return [];
		return searchResponse.results.map((item: any) =>
			toBrowserItem({
				...(item.data as Record<string, unknown>),
				entityType: item.type,
			})
		);
	}, [searchResponse]);

	const handleItemSelect = useCallback((item: any) => {
		clientLogger.debug('Search item selected:', item.id);
	}, []);

	const handleItemDoubleClick = useCallback(
		(item: BrowserItem) => {
			const entity = item.raw as unknown as any;
			if (!entity) return;

			if (entity.entityType === 'image') {
				const imageItems = browserItems
					.map((i: BrowserItem) => i.raw)
					.filter((i: any) => i?.entityType === 'image')
					.map((image: Record<string, unknown>) => toFileViewerItem(image, 'image'));
				const imgIndex = imageItems.findIndex((i: any) => i.id === entity.id);
				openViewer(imageItems, Math.max(0, imgIndex));
				return;
			}

			const routeByEntityType: Record<string, string> = {
				album: `/albums/${entity.id}`,
				collection: `/collections/${entity.id}`,
				group: `/groups/${entity.id}`,
				tag: `/tags/${entity.id}`,
				character: `/characters/${entity.id}`,
				place: `/places/${entity.id}`,
				'world-item': `/world-items/${entity.id}`,
				concept: `/concepts/${entity.id}`,
				prompt: `/prompts/${entity.id}`,
				property: `/properties/${entity.id}`,
				'json-file': `/json-files/${entity.id}`,
				jsonFile: `/json-files/${entity.id}`,
				file3d: `/file3d/${entity.id}`,
				'3d': `/file3d/${entity.id}`,
			};

			const directRoute = routeByEntityType[entity.entityType];
			if (directRoute) {
				navigate(directRoute);
				return;
			}

			const sectionByEntityType: Record<string, string> = {
				video: '/videos',
				audio: '/audios',
				document: '/documents',
				note: '/notes',
			};

			const sectionRoute = sectionByEntityType[entity.entityType];
			if (sectionRoute) {
				setSelectedItems([entity]);
				setVisible(true);
				navigate(sectionRoute);
				return;
			}

			clientLogger.info('Search entity has no specific route; showing it in the details panel', {
				id: entity.id,
				entityType: entity.entityType,
			});
			setSelectedItems([entity]);
			setVisible(true);
		},
		[browserItems, navigate, openViewer, setSelectedItems, setVisible]
	);

	return (
		<div className="flex h-full flex-col">
			<Card className="m-6">
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex gap-4">
							<Input
								className="flex-1"
								onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
								placeholder="Search images, videos, audio, documents..."
								value={filters.query}
							/>
							<Button disabled={!filters.query.trim()} onClick={() => setFilters((prev) => ({ ...prev }))}>
								Search
							</Button>
						</div>
						<Tabs
							className="w-full"
							defaultValue="all"
							onValueChange={(v) => setFilters((prev) => ({ ...prev, type: v as any }))}
							value={filters.type}
						>
							<TabsList>
								<TabsTrigger value="all">Todo</TabsTrigger>
								<TabsTrigger value="image">Images</TabsTrigger>
								<TabsTrigger value="video">Videos</TabsTrigger>
								<TabsTrigger value="audio">Audio</TabsTrigger>
								<TabsTrigger value="document">Docs</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</CardContent>
			</Card>
			<div className="flex-1 overflow-auto p-6">
				{isLoading ? (
					<LoadingScreen message="Buscando..." />
				) : error ? (
					<p className="text-center text-destructive">Search failed</p>
				) : filters.query ? (
					browserItems.length === 0 ? (
						<EmptyState description="Try different terms or clear the filters" icon={Search} title="Sin resultados" />
					) : (
						<div className="mb-4">
							<p className="mb-4 text-muted-foreground text-sm">
								Se encontraron <strong>{searchResponse?.total || 0}</strong> resultados para "
								<strong>{filters.query}</strong>"
							</p>
							<FileBrowser
								items={browserItems}
								onItemClick={(it) => handleItemSelect(it.raw)}
								onItemDoubleClick={handleItemDoubleClick}
							/>
						</div>
					)
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						<Search className="mb-4 h-12 w-12 opacity-20" />
						<p>Enter a search term</p>
					</div>
				)}
			</div>
		</div>
	);
}
