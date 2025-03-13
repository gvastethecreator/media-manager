'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import { useNavigation } from '@/lib/utils/navigation.utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, FileIcon, FileText, FolderIcon, Hash, ImageIcon, InfoIcon, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

// Definimos una interfaz para el tipo de retorno de getCurrentItem
interface EntityWithDynamicProperties {
	id: string | null;
	name: string;
	itemType: string;
	// Propiedades opcionales que pueden estar presentes
	count?: number;
	path?: string;
	totalSize?: number;
	lastIndexed?: Date;
	description?: string;
	createdAt?: Date;
	color?: string;
	emoji?: string;
}

/**
 * Componente que muestra información detallada sobre la entidad actual (carpeta, colección, etc.)
 * Se mostrará a la derecha de los breadcrumbs con un estilo más sutil
 */
export function EntityDetails() {
	const { currentView, getCurrentItem } = useNavigation();
	const currentItem = getCurrentItem() as EntityWithDynamicProperties | undefined;

	// Si no hay elemento actual o no es una vista de contenido, no mostrar nada
	if (!currentItem || !currentView.endsWith('-content')) {
		return null;
	}

	// Verificamos que el currentItem tenga las propiedades necesarias
	const hasProperty = <T extends keyof EntityWithDynamicProperties>(key: T): boolean =>
		currentItem !== undefined && key in currentItem;

	// Función para obtener un array de información específica según el tipo de entidad
	const getEntityDetails = () => {
		const baseView = currentView.replace('-content', '');
		const details = [];

		// Información común - conteo de imágenes
		if (hasProperty('count')) {
			details.push({
				icon: <ImageIcon className="h-3.5 w-3.5 text-muted-foreground mr-1" />,
				label: 'Imágenes',
				value: `${currentItem.count}`,
				tooltip: 'Número de imágenes en esta entidad',
			});
		}

		// Información específica por tipo
		switch (baseView) {
			case 'folder':
				if (hasProperty('path')) {
					details.push({
						icon: <FolderIcon className="h-3.5 w-3.5 text-muted-foreground mr-1" />,
						label: 'Ruta',
						value: currentItem.path,
						tooltip: 'Ruta completa de la carpeta',
					});
				}

				if (hasProperty('totalSize')) {
					details.push({
						icon: <FileIcon className="h-3.5 w-3.5 text-muted-foreground mr-1" />,
						label: 'Tamaño',
						value: formatBytes(currentItem.totalSize || 0),
						tooltip: 'Tamaño total de los archivos',
					});
				}

				if (hasProperty('lastIndexed')) {
					details.push({
						icon: <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1" />,
						label: 'Actualizado',
						value: format(new Date(currentItem.lastIndexed || new Date()), 'dd/MM/yyyy', {
							locale: es,
						}),
						tooltip: 'Última vez que se indexó esta carpeta',
					});
				}
				break;

			case 'collection':
			case 'album':
			case 'character':
			case 'place':
			case 'world-item':
				if (hasProperty('description')) {
					details.push({
						icon: <FileText className="h-3.5 w-3.5 text-muted-foreground mr-1" />,
						label: 'Descripción',
						value: currentItem.description || '',
						tooltip: `Descripción de ${currentItem.name}`,
					});
				}

				if (hasProperty('createdAt')) {
					details.push({
						icon: <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1" />,
						label: 'Creado',
						value: format(new Date(currentItem.createdAt || new Date()), 'dd/MM/yyyy', {
							locale: es,
						}),
						tooltip: 'Fecha de creación',
					});
				}
				break;

			case 'tag':
				details.push({
					icon: <Hash className="h-3.5 w-3.5 text-muted-foreground mr-1" />,
					label: 'Etiqueta',
					value: `#${currentItem.name}`,
					tooltip: 'Nombre de la etiqueta',
				});
				break;
		}

		return details;
	};

	const details = getEntityDetails();

	// Si no hay detalles para mostrar, mostrar un mensaje de depuración durante desarrollo
	if (details.length === 0) {
		return <div className="ml-2 text-xs text-muted-foreground">(No hay detalles para esta entidad)</div>;
	}

	return (
		<motion.div
			initial={{ opacity: 0, x: -5 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.15, delay: 0.1 }}
			className="ml-2 flex items-center gap-2"
		>
			{details.map((info) => (
				<TooltipProvider delayDuration={200} key={`${info.label}-${info.value}`}>
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={cn(
									'flex items-center text-[10px] text-muted-foreground px-2 py-0.5 bg-secondary/20 rounded-sm',
									'cursor-help transition-colors hover:bg-secondary/30'
								)}
							>
								{info.icon}
								<span className="font-medium mr-1">{info.label}:</span>
								<span className="truncate max-w-[150px]">{info.value}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="text-xs p-2">
							<p>{info.tooltip}</p>
							<p className="mt-1 text-[10px] max-w-[200px]">{info.value}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			))}
		</motion.div>
	);
}
