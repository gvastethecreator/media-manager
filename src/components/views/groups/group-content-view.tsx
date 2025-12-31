import { FileBox, ImageIcon, TagIcon } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGroup, useGroupImages } from '@/lib/api/groups';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ViewProps } from '../types';

const logger = clientLogger.withContext('GroupContentView');

export function GroupContentView(_props: ViewProps) {
	const params = useParams();
	const groupId = typeof params.id === 'string' ? params.id : null;
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	// Usar React Query hook en lugar de server action
	const { data: group, isLoading, error } = useGroup(groupId || '');
	const { data: images = [], isLoading: isLoadingImages, error: imagesError } = useGroupImages(groupId || '');
	const browserItems = useMemo(
		() => images.map((img) => toBrowserItem(img as unknown as Record<string, unknown>)),
		[images]
	);

	const handleItemSelect = useCallback(
		(item: BrowserItem) => {
			const entity = item.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity) return;
			setSelectedItems([entity]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (error || !group) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error instanceof Error ? error.message : 'Grupo no encontrado'}</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				{/* Cabecera del grupo */}
				<div className="mb-6 flex items-center gap-4">
					<div
						className="flex h-14 w-14 items-center justify-center rounded-full text-3xl"
						style={{ backgroundColor: `${group.color ?? '#60a5fa'}25` }}
					>
						{group.emoji || '📂'}
					</div>
					<div>
						<h1 className="font-bold text-2xl">{group.name}</h1>
						{group.category && <p className="text-muted-foreground">{group.category}</p>}
					</div>
				</div>

				{/* Descripción */}
				{group.description && (
					<div className="mb-6 rounded-lg bg-muted/30 p-4">
						<p>{group.description}</p>
					</div>
				)}

				{/* Pestañas para diferentes tipos de contenido */}
				<Tabs className="mt-6" defaultValue="all">
					<TabsList className="mb-4 grid grid-cols-4">
						<TabsTrigger value="all">Todos</TabsTrigger>
						<TabsTrigger value="images">
							<ImageIcon className="mr-2 h-4 w-4" />
							Imágenes
						</TabsTrigger>
						<TabsTrigger value="tags">
							<TagIcon className="mr-2 h-4 w-4" />
							Tags
						</TabsTrigger>
						<TabsTrigger value="entities">
							<FileBox className="mr-2 h-4 w-4" />
							Entidades
						</TabsTrigger>
					</TabsList>

					{/* Contenido de cada pestaña */}
					<TabsContent className="space-y-4" value="all">
						<p className="py-10 text-center text-muted-foreground">
							Este grupo contiene {group.stats?.totalItems ?? 0} entidades en total
						</p>
					</TabsContent>

					<TabsContent className="space-y-4" value="images">
						{imagesError ? (
							<div className="flex items-center justify-center py-10 text-destructive">
								Error: {imagesError instanceof Error ? imagesError.message : 'No se pudieron cargar las imágenes'}
							</div>
						) : isLoadingImages && images.length === 0 ? (
							<div className="py-6">
								<LoadingScreen message="Cargando imágenes del grupo..." />
							</div>
						) : images.length === 0 ? (
							<p className="py-10 text-center text-muted-foreground">Este grupo no tiene imágenes asociadas</p>
						) : (
							<div className="h-[60vh] min-h-90">
								<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
							</div>
						)}
					</TabsContent>

					<TabsContent className="space-y-4" value="tags">
						<p className="py-10 text-center text-muted-foreground">Este grupo contiene tags</p>
					</TabsContent>

					<TabsContent className="space-y-4" value="entities">
						<p className="py-10 text-center text-muted-foreground">Este grupo contiene entidades de diferentes tipos</p>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
							{/* Información general */}
							<div className="rounded-lg border bg-background p-4 transition-shadow hover:shadow-md">
								<p className="font-medium">Total de elementos</p>
								<p className="font-bold text-lg">{group.stats?.totalItems ?? 0}</p>
							</div>

							{/* Otros tipos... */}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</ScrollArea>
	);
}
