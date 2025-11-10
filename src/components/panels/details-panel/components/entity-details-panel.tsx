import { BookImage, Camera, Edit, Heart, Lightbulb, MapPin, MessageSquare, Package, StickyNote, TagIcon, Users, WandSparkles } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageFallback } from '@/components/ui/image-fallback';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/entities';
import { getMainImageUrl } from '../utils/image-utils';
import { MetadataTable } from './metadata-table';

interface EntityDetailsPanelProps {
	item: AnyEntityWithStats;
	className?: string;
}

/**
 * Panel de detalles especializado para entidades abstractas
 * (Characters, Places, Concepts, Collections, Albums, Tags, etc.)
 */
export const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({ item, className = '' }) => {
	const mainImageUrl = getMainImageUrl(item);

	// Detectar tipo de entidad
	const entityType = item.entityType;

	// Iconos por tipo de entidad
	const getEntityIcon = () => {
		switch (entityType) {
			case 'character':
				return Users;
			case 'place':
				return MapPin;
			case 'concept':
				return Lightbulb;
			case 'collection':
				return BookImage;
			case 'album':
				return Camera;
			case 'tag':
				return TagIcon;
			case 'group':
				return Package;
			case 'note':
				return StickyNote;
			case 'prompt':
				return MessageSquare;
			case 'wildcard':
				return WandSparkles;
			default:
				return Package;
		}
	};

	const EntityIcon = getEntityIcon();

	// Obtener metadatos específicos según el tipo de entidad
	const getEntityMetadata = () => {
		const metadata: Array<{ label: string; value: string; icon?: any }> = [];

		// Campos comunes
		if ('createdAt' in item && item.createdAt) {
			metadata.push({
				label: 'Creado',
				value: new Date(item.createdAt).toLocaleDateString(),
			});
		}

		if ('updatedAt' in item && item.updatedAt) {
			metadata.push({
				label: 'Actualizado',
				value: new Date(item.updatedAt).toLocaleDateString(),
			});
		}

		// Estadísticas específicas por tipo
		if ('totalImages' in item && item.totalImages !== undefined) {
			metadata.push({
				label: 'Imágenes',
				value: item.totalImages.toString(),
			});
		}

		if ('totalVideos' in item && item.totalVideos !== undefined) {
			metadata.push({
				label: 'Videos',
				value: item.totalVideos.toString(),
			});
		}

		if ('_count' in item && item._count) {
			const count = item._count as any;
			if (count.images !== undefined) {
				metadata.push({
					label: 'Imágenes',
					value: count.images.toString(),
				});
			}
			if (count.videos !== undefined) {
				metadata.push({
					label: 'Videos',
					value: count.videos.toString(),
				});
			}
			if (count.items !== undefined) {
				metadata.push({
					label: 'Items',
					value: count.items.toString(),
				});
			}
		}

		// Metadatos específicos de Character
		if (entityType === 'character' && 'gender' in item && item.gender) {
			metadata.push({
				label: 'Género',
				value: item.gender,
			});
		}

		// Metadatos específicos de Place
		if (entityType === 'place') {
			if ('location' in item && item.location) {
				metadata.push({
					label: 'Ubicación',
					value: item.location,
				});
			}
		}

		// Metadatos específicos de Concept
		if (entityType === 'concept' && 'category' in item && item.category) {
			metadata.push({
				label: 'Categoría',
				value: item.category,
			});
		}

		return metadata;
	};

	const metadata = getEntityMetadata();

	// Obtener contenido adicional (para Concept, Note, Prompt)
	const getAdditionalContent = () => {
		if (entityType === 'concept' && 'content' in item && item.content) {
			return {
				title: 'Contenido',
				content: item.content,
			};
		}

		if (entityType === 'note' && 'content' in item && item.content) {
			return {
				title: 'Nota',
				content: item.content,
			};
		}

		if (entityType === 'prompt' && 'content' in item && item.content) {
			return {
				title: 'Prompt',
				content: item.content,
			};
		}

		return null;
	};

	const additionalContent = getAdditionalContent();

	return (
		<div className={cn('entity-details-panel flex h-full w-full flex-col bg-background', className)}>
			<div className="flex-1 overflow-y-auto">
				<div className="w-full p-1">
					{/* Toolbar de acciones */}
					<div className="flex items-center gap-1 bg-secondary/40 px-2 py-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="icon" variant="ghost">
									<Edit className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Editar</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="icon" variant="ghost">
									<Heart
										className={cn('h-4 w-4', 'isFavorite' in item && item.isFavorite && 'fill-red-500 text-red-500')}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>{`${'isFavorite' in item && item.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}`}</TooltipContent>
						</Tooltip>
					</div>

					{/* Imagen principal si existe */}
					{mainImageUrl && (
						<div className="relative w-full overflow-hidden p-1">
							<ImageFallback
								alt={'name' in item ? item.name || 'Sin nombre' : 'Sin nombre'}
								className="h-auto w-full rounded-md object-cover"
								src={mainImageUrl}
							/>
						</div>
					)}

					{/* Header con nombre y descripción */}
					<div className="flex-shrink-0 space-y-2 p-3">
						<div className="flex items-center gap-2">
							<EntityIcon className="h-5 w-5 text-muted-foreground" />
							<h2 className="flex-1 truncate font-semibold text-sm">{'name' in item ? item.name : 'Sin nombre'}</h2>
						</div>

						{'description' in item && item.description && (
							<p className="text-muted-foreground text-sm">{item.description}</p>
						)}

						{/* Badge de tipo de entidad */}
						<Badge variant="secondary">
							{entityType === 'character' && 'Personaje'}
							{entityType === 'place' && 'Lugar'}
							{entityType === 'concept' && 'Concepto'}
							{entityType === 'collection' && 'Colección'}
							{entityType === 'album' && 'Álbum'}
							{entityType === 'tag' && 'Etiqueta'}
							{entityType === 'group' && 'Grupo'}
							{entityType === 'note' && 'Nota'}
							{entityType === 'prompt' && 'Prompt'}
							{entityType === 'wildcard' && 'Comodín'}
							{!entityType && 'Entidad'}
						</Badge>
					</div>

					{/* Metadatos */}
					{metadata.length > 0 && (
						<div className="px-3 pb-3">
							<MetadataTable
								dense
								rows={metadata.map((m) => ({
									label: m.label,
									value: m.value,
									icon: m.icon,
								}))}
								title="Información"
							/>
						</div>
					)}

					{/* Contenido adicional (para Concept, Note, Prompt) */}
					{additionalContent && (
						<div className="px-3 pb-3">
							<div className="rounded-md border bg-muted/30 p-3">
								<h3 className="mb-2 font-medium text-sm">{additionalContent.title}</h3>
								<p className="whitespace-pre-wrap text-muted-foreground text-xs">{additionalContent.content}</p>
							</div>
						</div>
					)}

					{/* Color y Emoji (si están disponibles) */}
					{'color' in item && item.color && 'emoji' in item && item.emoji && (
						<div className="px-3 pb-3">
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-sm">Color:</span>
									<div
										className="h-6 w-6 rounded border"
										style={{ backgroundColor: item.color as string }}
										title={item.color as string}
									/>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-sm">Emoji:</span>
									<span className="text-2xl">{item.emoji as string}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
