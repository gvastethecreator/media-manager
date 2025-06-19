'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FileItem } from '@/types/file-item';
import {
	BookImage,
	Calendar,
	Download,
	FileImage,
	FolderPlus,
	Grid2X2,
	HardDrive,
	ImageIcon,
	Layers,
	MapPin,
	PenSquare,
	Tag,
	Trash2,
	User2,
	Video,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { BulkMetadataEditor } from './bulk-metadata-editor';

export interface MultipleSelectionInfoProps {
	items: FileItem[];
}

/**
 * Componente para mostrar información agregada de múltiples elementos seleccionados
 */
export const MultipleSelectionInfo = memo<MultipleSelectionInfoProps>(function MultipleSelectionInfo({ items }) {
	// Calcular estadísticas de los elementos seleccionados
	const stats = useMemo(() => {
		let totalSize = 0;
		const types = new Map<string, number>();
		const tags = new Map<string, number>();
		const collections = new Map<string, number>();
		const albums = new Map<string, number>();
		const characters = new Map<string, number>();
		const places = new Map<string, number>();
		const worldItems = new Map<string, number>();
		let oldestDate = new Date();
		let newestDate = new Date(0);

		// Procesar cada elemento
		for (const item of items) {
			// Tamaño total
			totalSize += item.size || 0;

			// Contar tipos de archivo
			if (item.type?.startsWith('image/')) {
				types.set('image', (types.get('image') || 0) + 1);
			} else if (item.type?.startsWith('video/')) {
				types.set('video', (types.get('video') || 0) + 1);
			} else if (item.type?.startsWith('audio/')) {
				types.set('audio', (types.get('audio') || 0) + 1);
			} else {
				types.set('unknown', (types.get('unknown') || 0) + 1);
			}

			// Contar etiquetas
			if (item.tags) {
				for (const tag of item.tags) {
					tags.set(tag.name, (tags.get(tag.name) || 0) + 1);
				}
			}

			// Contar colecciones
			if (item.collections) {
				for (const collection of item.collections) {
					collections.set(collection.name, (collections.get(collection.name) || 0) + 1);
				}
			}

			// Contar álbumes
			if (item.albums) {
				for (const album of item.albums) {
					albums.set(album.name, (albums.get(album.name) || 0) + 1);
				}
			}

			// Contar personajes
			if (item.characters) {
				for (const character of item.characters) {
					characters.set(character.name, (characters.get(character.name) || 0) + 1);
				}
			}

			// Contar lugares
			if (item.places) {
				for (const place of item.places) {
					places.set(place.name, (places.get(place.name) || 0) + 1);
				}
			}

			// Contar objetos del mundo
			if (item.worldItems) {
				for (const worldItem of item.worldItems) {
					worldItems.set(worldItem.name, (worldItems.get(worldItem.name) || 0) + 1);
				}
			}

			// Fechas
			const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
			if (createdDate < oldestDate) oldestDate = createdDate;
			if (createdDate > newestDate) newestDate = createdDate;
		}

		return {
			totalSize,
			types: Array.from(types.entries()),
			tags: Array.from(tags.entries()).sort((a, b) => b[1] - a[1]),
			collections: Array.from(collections.entries()),
			albums: Array.from(albums.entries()),
			characters: Array.from(characters.entries()),
			places: Array.from(places.entries()),
			worldItems: Array.from(worldItems.entries()),
			oldestDate,
			newestDate,
		};
	}, [items]);

	// Formatear tamaño de archivo
	const formatFileSize = (bytes: number): string => {
		if (bytes <= 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	// Obtener ícono según tipo de archivo
	const getTypeIcon = (type: string) => {
		switch (type) {
			case 'image':
				return <ImageIcon className="h-3.5 w-3.5 text-blue-500" />;
			case 'video':
				return <Video className="h-3.5 w-3.5 text-red-500" />;
			default:
				return <FileImage className="h-3.5 w-3.5 text-gray-500" />;
		}
	};

	return (
		<div className="flex flex-col h-full">
			{/* Cabecera con resumen */}
			<div className="p-3 border-b">
				<h3 className="text-sm font-medium mb-2">Selección múltiple ({items.length} elementos)</h3>
				<div className="flex flex-wrap gap-1.5">
					{stats.types.map(([type, count]) => (
						<Badge key={type} variant="outline" className="flex items-center gap-1">
							{getTypeIcon(type)}
							<span>
								{count} {type}
							</span>
						</Badge>
					))}
					<Badge variant="outline" className="flex items-center gap-1">
						<HardDrive className="h-3.5 w-3.5" />
						<span>{formatFileSize(stats.totalSize)}</span>
					</Badge>
				</div>
			</div>

			{/* Acciones masivas */}
			<div className="p-3 border-b bg-muted/20">
				<h4 className="text-xs text-muted-foreground mb-2">Acciones masivas</h4>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" size="sm" className="h-8 text-xs">
						<Download className="h-3.5 w-3.5 mr-1" />
						Descargar
					</Button>
					<Button variant="outline" size="sm" className="h-8 text-xs">
						<Tag className="h-3.5 w-3.5 mr-1" />
						Añadir etiquetas
					</Button>
					<Button variant="outline" size="sm" className="h-8 text-xs">
						<BookImage className="h-3.5 w-3.5 mr-1" />
						Añadir a colección
					</Button>
					<Button variant="outline" size="sm" className="h-8 text-xs">
						<FolderPlus className="h-3.5 w-3.5 mr-1" />
						Mover a carpeta
					</Button>
					<Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:text-destructive">
						<Trash2 className="h-3.5 w-3.5 mr-1" />
						Eliminar
					</Button>
				</div>

				{/* Editor de metadatos en masa */}
				<div className="mt-3">
					<BulkMetadataEditor items={items} />
				</div>
			</div>

			{/* Contenido principal */}
			<ScrollArea className="flex-1">
				<div className="p-3 space-y-4">
					{/* Miniaturas */}
					<div>
						<h4 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-2 flex items-center gap-1">
							<Grid2X2 className="h-3.5 w-3.5" />
							<span>Vista previa</span>
						</h4>
						<div className="grid grid-cols-3 gap-1.5">
							{items.slice(0, 9).map((item, index) => (
								<div key={item.id} className="relative aspect-square bg-muted/30 rounded-md overflow-hidden">
									<img
										src={item.thumbnailUrl || item.url || ''}
										alt={item.name || `Item ${index + 1}`}
										className="w-full h-full object-cover"
									/>
								</div>
							))}
							{items.length > 9 && (
								<div className="aspect-square bg-muted/30 rounded-md flex items-center justify-center">
									<span className="text-xs text-muted-foreground">+{items.length - 9} más</span>
								</div>
							)}
						</div>
					</div>

					{/* Metadatos comunes */}
					<div>
						<h4 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-2 flex items-center gap-1">
							<PenSquare className="h-3.5 w-3.5" />
							<span>Información</span>
						</h4>
						<div className="space-y-2 text-xs">
							<div className="flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="text-muted-foreground">Creados entre:</span>
								<span>
									{stats.oldestDate.toLocaleDateString()} - {stats.newestDate.toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>

					{/* Etiquetas comunes */}
					{stats.tags.length > 0 && (
						<div>
							<h4 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-2 flex items-center gap-1">
								<Tag className="h-3.5 w-3.5" />
								<span>Etiquetas comunes</span>
							</h4>
							<div className="flex flex-wrap gap-1.5">
								{stats.tags.slice(0, 10).map(([tag, count]) => (
									<Badge key={tag} variant="secondary" className="text-xs">
										{tag} ({count})
									</Badge>
								))}
								{stats.tags.length > 10 && (
									<Badge variant="outline" className="text-xs">
										+{stats.tags.length - 10} más
									</Badge>
								)}
							</div>
						</div>
					)}

					{/* Colecciones comunes */}
					{stats.collections.length > 0 && (
						<div>
							<h4 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-2 flex items-center gap-1">
								<BookImage className="h-3.5 w-3.5" />
								<span>Colecciones</span>
							</h4>
							<div className="flex flex-wrap gap-1.5">
								{stats.collections.map(([collection, count]) => (
									<Badge key={collection} variant="outline" className="bg-blue-500/10 text-blue-500 text-xs">
										{collection} ({count})
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Otros elementos relacionados */}
					{(stats.albums.length > 0 || stats.characters.length > 0 || stats.places.length > 0) && (
						<div>
							<h4 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-2 flex items-center gap-1">
								<Layers className="h-3.5 w-3.5" />
								<span>Otros elementos relacionados</span>
							</h4>
							<div className="space-y-2">
								{/* Álbumes */}
								{stats.albums.length > 0 && (
									<div className="flex items-start gap-2">
										<div className="pt-0.5">
											<User2 className="h-3.5 w-3.5 text-purple-500" />
										</div>
										<div className="flex-1">
											<span className="text-xs text-muted-foreground">Álbumes:</span>
											<div className="flex flex-wrap gap-1 mt-1">
												{stats.albums.map(([album, count]) => (
													<Badge key={album} variant="outline" className="bg-purple-500/10 text-purple-500 text-xs">
														{album} ({count})
													</Badge>
												))}
											</div>
										</div>
									</div>
								)}

								{/* Personajes */}
								{stats.characters.length > 0 && (
									<div className="flex items-start gap-2">
										<div className="pt-0.5">
											<User2 className="h-3.5 w-3.5 text-yellow-500" />
										</div>
										<div className="flex-1">
											<span className="text-xs text-muted-foreground">Personajes:</span>
											<div className="flex flex-wrap gap-1 mt-1">
												{stats.characters.map(([character, count]) => (
													<Badge key={character} variant="outline" className="bg-yellow-500/10 text-yellow-500 text-xs">
														{character} ({count})
													</Badge>
												))}
											</div>
										</div>
									</div>
								)}

								{/* Lugares */}
								{stats.places.length > 0 && (
									<div className="flex items-start gap-2">
										<div className="pt-0.5">
											<MapPin className="h-3.5 w-3.5 text-orange-500" />
										</div>
										<div className="flex-1">
											<span className="text-xs text-muted-foreground">Lugares:</span>
											<div className="flex flex-wrap gap-1 mt-1">
												{stats.places.map(([place, count]) => (
													<Badge key={place} variant="outline" className="bg-orange-500/10 text-orange-500 text-xs">
														{place} ({count})
													</Badge>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
});
