import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/use-debounce';
import { useSearchUnified } from '@/lib/api/search';
import { useImageViewer } from '@/store/image-viewer.store';
import { clientLogger } from '@/lib/logger/client-logger';
import type { ViewProps } from '../types';

export function SearchView(_props: ViewProps) {
	const [filters, setFilters] = useState({ query: '', type: 'all' as 'all' | 'image' | 'video' | 'audio' | 'document' });
	const debouncedQuery = useDebounce(filters.query, 500);

	const { data: searchResponse, isLoading, error } = useSearchUnified({
		query: debouncedQuery,
		type: filters.type,
		limit: 100,
	});

	const { openViewer } = useImageViewer();

	const browserItems = useMemo(() => {
		if (!searchResponse?.results) return [];
		return searchResponse.results.map((item: any) => toBrowserItem(item.data as unknown as Record<string, unknown>));
	}, [searchResponse]);

	const handleItemSelect = useCallback((item: any) => {
		clientLogger.debug('Item seleccionado en búsqueda:', item.id);
	}, []);

	const handleItemDoubleClick = useCallback((item: BrowserItem) => {
		const entity = item.raw as unknown as any;
		if (!entity) return;

		if (entity.entityType === 'image') {
			const imageItems = browserItems.map(i => i.raw).filter(i => i?.entityType === 'image');
			const imgIndex = imageItems.findIndex(i => i.id === entity.id);
			openViewer(imageItems as any, Math.max(0, imgIndex));
		} else {
			clientLogger.info('Abrir entidad no-imagen (placeholder)', { id: entity.id });
		}
	}, [browserItems, openViewer]);

	return (
		<div className="flex h-full flex-col">
			<Card className="m-6">
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex gap-4">
							<Input
								className="flex-1"
								onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
								placeholder="Buscar imágenes, videos, audios, documentos..."
								value={filters.query}
							/>
							<Button disabled={!filters.query.trim()} onClick={() => setFilters(prev => ({ ...prev }))}>
								Buscar
							</Button>
						</div>
						<Tabs className="w-full" defaultValue="all" value={filters.type} onValueChange={(v) => setFilters(prev => ({ ...prev, type: v as any }))}>
							<TabsList>
								<TabsTrigger value="all">Todo</TabsTrigger>
								<TabsTrigger value="image">Imágenes</TabsTrigger>
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
					<p className="text-destructive text-center">Error al realizar búsqueda</p>
				) : !filters.query ? (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						<Search className="h-12 w-12 mb-4 opacity-20" />
						<p>Escribe algo para buscar</p>
					</div>
				) : browserItems.length === 0 ? (
					<EmptyState description="Intenta con otros términos o elimina filtros" icon={Search} title="Sin resultados" />
				) : (
					<div className="mb-4">
						<p className="text-muted-foreground text-sm mb-4">
							Se encontraron <strong>{searchResponse?.total || 0}</strong> resultados para "<strong>{filters.query}</strong>"
						</p>
						<FileBrowser items={browserItems} onItemClick={(it) => handleItemSelect(it.raw)} onItemDoubleClick={handleItemDoubleClick} />
					</div>
				)}
			</div>
		</div>
	);
}
