import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser, toBrowserItem, type BrowserItem } from '@/components/features/file-browser-new';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImageStore } from '@/store/entities/image';
import { useImageViewer } from '@/store/image-viewer.store';
import type { AnyEntityWithStats } from '@/types/entities';
import type { EntityWithStats } from '@/types/entities/entity.types';
import type { ImageWithStats } from '@/types/entities/image';
import { isImageWithStats } from '@/types/entity-guards';
import type { ViewProps } from '../types';
import { clientLogger } from '@/lib/logger/client-logger';

interface SearchFilters {
	query: string;
	type: 'name' | 'content' | 'metadata' | 'all';
	dateFrom?: Date;
	dateTo?: Date;
	tags?: string[];
	collections?: string[];
	folders?: string[];
}

// const _PAGE_SIZE = 100; // No usado por ahora

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
	const { isLoading, getSortedImages, loadImages } = useImageStore();

	const { openViewer } = useImageViewer();

	// Obtener imágenes tipadas del store
	const items: ImageWithStats[] = getSortedImages();

	const handleSearch = useCallback(async () => {
		if (!filters.query) {
			return;
		}

		try {
			// TODO: Implementar búsqueda con EntityWithStats
			// Por ahora, cargar todas las imágenes
			await loadImages();
		} catch (err) {
			clientLogger.error('Error en búsqueda:', err);
		}
	}, [filters, loadImages]);

	const handleItemSelect = useCallback((item: AnyEntityWithStats) => {
		// TODO: Implementar selección con el nuevo sistema
		clientLogger.debug('Item seleccionado:', item.id);
	}, []);

	const handleItemDoubleClick = useCallback(
		(item: BrowserItem) => {
			// ✅ Usar directamente las imágenes tipadas del store con EntityWithStats
			const entity = item.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity || !isImageWithStats(entity)) {
				return;
			}

			const imageItems: ImageWithStats[] = items;
			const currentIndex = imageItems.findIndex((i) => i.id === entity.id);

			// openViewer espera EntityWithStats[]; adaptamos a tipo más amplio sin copiar
			const asEntities = imageItems as unknown as EntityWithStats[];
			openViewer(asEntities, currentIndex < 0 ? 0 : currentIndex);
		},
		[openViewer, items]
	);

	const renderContent = () => {
		if (isLoading) {
			return <LoadingScreen />;
		}
		if (items && items.length > 0) {
			return (
				<FileBrowser
					items={items.map((it) => toBrowserItem(it as unknown as Record<string, unknown>))}
					onItemClick={(it) => {
						const entity = it.raw as unknown as AnyEntityWithStats | undefined;
						if (entity) handleItemSelect(entity);
					}}
					onItemDoubleClick={handleItemDoubleClick}
				/>
			);
		}
		if (filters.query) {
			return (
				<EmptyState
					description="Intenta con otros términos de búsqueda"
					icon={Search}
					title="No se encontraron resultados"
				/>
			);
		}
		return null;
	};

	return (
		<div className="flex h-full flex-col">
			<Card className="m-6">
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex gap-4">
							<Input
								onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleSearch();
									}
								}}
								placeholder="Buscar imágenes..."
								value={filters.query}
							/>
							<Button onClick={handleSearch} type="button">
								Buscar
							</Button>
						</div>

						<Tabs className="w-full" defaultValue="basic">
							<TabsList>
								<TabsTrigger value="basic">Búsqueda Básica</TabsTrigger>
								<TabsTrigger value="advanced">Filtros Avanzados</TabsTrigger>
							</TabsList>
							<TabsContent className="space-y-4" value="basic">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Tipo de búsqueda</Label>
										<select
											className="w-full rounded border p-2"
											onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as any }))}
											value={filters.type}
										>
											<option value="all">Todo</option>
											<option value="name">Nombre</option>
											<option value="content">Contenido</option>
											<option value="metadata">Metadatos</option>
										</select>
									</div>
								</div>
							</TabsContent>
							<TabsContent className="space-y-4" value="advanced">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Fecha desde</Label>
										<Input
											onChange={(e) =>
												setFilters((prev) => ({
													...prev,
													dateFrom: e.target.value ? new Date(e.target.value) : undefined,
												}))
											}
											type="date"
										/>
									</div>
									<div>
										<Label>Fecha hasta</Label>
										<Input
											onChange={(e) =>
												setFilters((prev) => ({
													...prev,
													dateTo: e.target.value ? new Date(e.target.value) : undefined,
												}))
											}
											type="date"
										/>
									</div>
								</div>
								<div>
									<Label>Tags (separados por comas)</Label>
									<Input
										onChange={(e) => {
											const tags = e.target.value
												.split(',')
												.map((tag) => tag.trim())
												.filter(Boolean);
											setFilters((prev) => ({ ...prev, tags }));
										}}
										placeholder="tag1, tag2, tag3"
									/>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</CardContent>
			</Card>

			<div className="flex-1 overflow-auto p-6">{renderContent()}</div>
		</div>
	);
}
