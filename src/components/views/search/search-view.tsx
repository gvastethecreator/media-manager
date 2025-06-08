'use client';

import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileStore } from '@/store/entities/file';
import { useImageViewer } from '@/store/image-viewer.store';
import type { FileItem } from '@/types/file-item';
import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { ViewProps } from '../types';

interface SearchFilters {
	query: string;
	type: 'name' | 'content' | 'metadata' | 'all';
	dateFrom?: Date;
	dateTo?: Date;
	tags?: string[];
	collections?: string[];
	folders?: string[];
}

const _PAGE_SIZE = 100;

const getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

export function SearchView(_props: ViewProps) {
	const [filters, setFilters] = useState<SearchFilters>({
		query: '',
		type: 'all',
	});

	const { items, toggleItemSelection, setIsLoading, isLoading } = useFileStore((state) => ({
		items: state.files,
		toggleItemSelection: state.toggleFileSelection,
		setIsLoading: state.setLoading,
		isLoading: state.isLoading,
	}));

	const { openViewer } = useImageViewer();

	const handleSearch = useCallback(async () => {
		if (!filters.query) return;

		try {
			setIsLoading(true);
			const { searchImages } = await import('@/app/actions/search/search.actions');
			const files = await searchImages(filters.query, _PAGE_SIZE);
			useFileStore.setState({ files });
		} catch (err) {
			console.error('Error en búsqueda:', err);
		} finally {
			setIsLoading(false);
		}
	}, [filters, setIsLoading]);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			toggleItemSelection(item);
		},
		[toggleItemSelection]
	);

	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			const metadata = getMetadata(item.metadata);
			if (item.type === 'image' || metadata?.mimeType?.startsWith('image/')) {
				const imageItems = (items || []).filter((i) => {
					const meta = getMetadata(i.metadata);
					return i.type === 'image' || meta?.mimeType?.startsWith('image/');
				});
				openViewer(
					imageItems,
					imageItems.findIndex((i) => i.id === item.id)
				);
			}
		},
		[openViewer, items]
	);

	return (
		<div className="h-full flex flex-col">
			<Card className="m-6">
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex gap-4">
							<Input
								placeholder="Buscar imágenes..."
								value={filters.query}
								onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleSearch();
									}
								}}
							/>
							<Button type="button" onClick={handleSearch}>
								Buscar
							</Button>
						</div>

						<Tabs defaultValue="basic" className="w-full">
							<TabsList>
								<TabsTrigger value="basic">Básica</TabsTrigger>
								<TabsTrigger value="advanced">Avanzada</TabsTrigger>
							</TabsList>
							<TabsContent value="basic">{/* TODO: Implementar filtros básicos */}</TabsContent>
							<TabsContent value="advanced">{/* TODO: Implementar filtros avanzados */}</TabsContent>
						</Tabs>
					</div>
				</CardContent>
			</Card>

			<div className="flex-1 overflow-auto p-6">
				{isLoading ? (
					<LoadingScreen />
				) : items && items.length > 0 ? (
					<FileBrowser items={items} onItemClick={handleItemClick} onItemDoubleClick={handleItemDoubleClick} />
				) : filters.query ? (
					<EmptyState
						icon={Search}
						title="No se encontraron resultados"
						description="Intenta con otros términos de búsqueda"
					/>
				) : null}
			</div>
		</div>
	);
}
