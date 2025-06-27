'use client';

import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowserV2 } from '@/components/features/file-browser/file-browser-v2';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImageStore } from '@/store/entities/image';
import { useImageViewer } from '@/store/image-viewer.store';
import type { EntityWithStats } from '@/types/migration';
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

/**
 * ✅ MIGRADO: SearchView ahora usa FileBrowserV2 con EntityWithStats
 * - FileBrowser → FileBrowserV2
 * - FileItem → EntityWithStats
 * - useFileStore → useImageStore (específico por entidad)
 */
export function SearchView(_props: ViewProps) {
	const [filters, setFilters] = useState<SearchFilters>({
		query: '',
		type: 'all',
	});

	// ✅ MIGRADO: Usar store específico de imágenes
	const {
		images: imagesRecord,
		isLoading,
		getSortedImages,
		loadImages
	} = useImageStore();

	const { openViewer } = useImageViewer();

	// Convertir el record a array para compatibilidad
	const items = getSortedImages();

	const handleSearch = useCallback(async () => {
		if (!filters.query) return;

		try {
			// TODO: Implementar búsqueda con EntityWithStats
			// Por ahora, cargar todas las imágenes
			await loadImages();
		} catch (err) {
			console.error('Error en búsqueda:', err);
		}
	}, [filters, loadImages]);

	const handleItemSelect = useCallback(
		(item: EntityWithStats) => {
			// TODO: Implementar selección con el nuevo sistema
			console.log('Item seleccionado:', item.id);
		},
		[]
	);

	const handleItemDoubleClick = useCallback(
		(item: EntityWithStats) => {
			// ✅ MIGRADO: Usar EntityWithStats en lugar de FileItem
			if (item.type === 'image') {
				const imageItems = items.filter(i => i.type === 'image');
				const currentIndex = imageItems.findIndex(i => i.id === item.id);

				// Convertir EntityWithStats a formato compatible con viewer
				const viewerItems = imageItems.map(img => ({
					id: img.id,
					name: img.name || '',
					src: img.thumbnailUrl || `/api/images/${img.id}/content`,
					alt: img.name || '',
					width: 'width' in img ? img.width : 0,
					height: 'height' in img ? img.height : 0,
					thumbnail: img.thumbnailUrl || null,
					type: 'image',
					path: img.path || '',
					size: 'size' in img ? img.size : 0,
					mimeType: 'mimeType' in img ? img.mimeType : '',
					metadata: null,
					url: img.thumbnailUrl || `/api/images/${img.id}/content`,
					parsedMetadata: undefined,
				}));

				openViewer(viewerItems, currentIndex);
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
					<FileBrowserV2
						entityType="image"
						onItemSelect={handleItemSelect}
						onItemDoubleClick={handleItemDoubleClick}
					/>
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
