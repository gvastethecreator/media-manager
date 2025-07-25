import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImageStore } from '@/store/entities/image';
import { useImageViewer } from '@/store/image-viewer.store';
import type { ImageWithStats } from '@/types/entities/image';
import type { AnyEntityWithStats, EntityWithStats } from '@/types/migration';
import { isImageWithStats } from '@/types/migration';
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
	const { images: imagesRecord, isLoading, getSortedImages, loadImages } = useImageStore();

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

	const handleItemSelect = useCallback((item: AnyEntityWithStats) => {
		// TODO: Implementar selección con el nuevo sistema
		console.log('Item seleccionado:', item.id);
	}, []);

	const handleItemDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			// ✅ MIGRADO: Usar EntityWithStats en lugar de FileItem
			if (isImageWithStats(item)) {
				const image = item as ImageWithStats;
				const imageItems = (items || []).filter((i: AnyEntityWithStats) => isImageWithStats(i));
				const currentIndex = imageItems.findIndex((i: AnyEntityWithStats) => i.id === item.id);

				// Convertir EntityWithStats a formato compatible con viewer
				const viewerItems = imageItems
					.map((img: AnyEntityWithStats) => {
						if (isImageWithStats(img)) {
							const imageItem = img as ImageWithStats;
							return {
								id: imageItem.id,
								name: imageItem.name || '',
								src: imageItem.fullUrl || `/api/images/${imageItem.id}/content`,
								alt: imageItem.name || '',
								width: imageItem.width || 0,
								height: imageItem.height || 0,
								thumbnail: imageItem.thumbnailUrl || null,
								type: 'image',
								path: '',
								size: imageItem.size || 0,
								mimeType: 'image/jpeg', // Default mime type since mimeType is not available in ImageWithStats
								metadata: null,
								url: imageItem.fullUrl || `/api/images/${imageItem.id}/content`,
								parsedMetadata: undefined,
							};
						}
						return null;
					})
					.filter(Boolean);

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
								<TabsTrigger value="basic">Búsqueda Básica</TabsTrigger>
								<TabsTrigger value="advanced">Filtros Avanzados</TabsTrigger>
							</TabsList>
							<TabsContent value="basic" className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Tipo de búsqueda</Label>
										<select
											value={filters.type}
											onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as any }))}
											className="w-full p-2 border rounded"
										>
											<option value="all">Todo</option>
											<option value="name">Nombre</option>
											<option value="content">Contenido</option>
											<option value="metadata">Metadatos</option>
										</select>
									</div>
								</div>
							</TabsContent>
							<TabsContent value="advanced" className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Fecha desde</Label>
										<Input
											type="date"
											onChange={(e) =>
												setFilters((prev) => ({
													...prev,
													dateFrom: e.target.value ? new Date(e.target.value) : undefined,
												}))
											}
										/>
									</div>
									<div>
										<Label>Fecha hasta</Label>
										<Input
											type="date"
											onChange={(e) =>
												setFilters((prev) => ({
													...prev,
													dateTo: e.target.value ? new Date(e.target.value) : undefined,
												}))
											}
										/>
									</div>
								</div>
								<div>
									<Label>Tags (separados por comas)</Label>
									<Input
										placeholder="tag1, tag2, tag3"
										onChange={(e) => {
											const tags = e.target.value
												.split(',')
												.map((tag) => tag.trim())
												.filter(Boolean);
											setFilters((prev) => ({ ...prev, tags }));
										}}
									/>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</CardContent>
			</Card>

			<div className="flex-1 overflow-auto p-6">
				{isLoading ? (
					<LoadingScreen />
				) : items && items.length > 0 ? (
					<FileBrowser entityType="mixed" onItemSelect={handleItemSelect} onItemDoubleClick={handleItemDoubleClick} />
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
