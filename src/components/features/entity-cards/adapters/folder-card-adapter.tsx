'use client';

import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format';
import type { Folder } from '@/types/entities/folders';
import { FileIcon, FolderIcon, Layers3 } from 'lucide-react';
import { Fragment } from 'react';
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import type { CardOptions } from '../types/card-settings-types';

export interface FolderCardAdapterProps {
	folder: Folder;
	onClick?: () => void;
	className?: string;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	visualOptions?: Partial<CardOptions>;
}

/**
 * Adaptador para renderizar carpetas como tarjetas estilo Magic
 */
export function FolderCardAdapter({
	folder,
	onClick,
	className,
	showVisualConfig = false,
	onVisualConfigClick,
	enableExplode = false,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
	visualOptions = {},
}: FolderCardAdapterProps) {
	// Usar el hook para obtener configuración de preset si existe
	const { cardOptions } = usePreset({
		entityType: 'folder',
		entityId: folder.id,
		presetId: folder.presetId || null,
		baseOptions: visualOptions,
	});

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{
			id: 'background',
			label: 'Fondo',
			icon: <Layers3 className="h-4 w-4" />,
		},
		{
			id: 'frame',
			label: 'Marco',
			icon: <FolderIcon className="h-4 w-4" />,
		},
		{
			id: 'content',
			label: 'Contenido',
			icon: <FileIcon className="h-4 w-4" />,
		},
	];

	return (
		<EntityCardWrapper
			className={cn('folder-card', className)}
			entityType="folder"
			options={cardOptions}
			onClick={onClick}
			showVisualizationConfig={showVisualConfig}
			onVisualizationConfigClick={onVisualConfigClick}
			enableExplode={enableExplode}
			explodeLayers={explodeLayers}
			isExploded={isExploded}
			activeLayer={activeLayer}
			onExplodedChange={onExplodedChange}
			onActiveLayerChange={onActiveLayerChange}
		>
			<div className="folder-card-content">
				{/* Encabezado de la tarjeta */}
				<div className="folder-card-header">
					<div className="folder-card-title-container">
						{folder.emoji && <span className="folder-card-emoji">{folder.emoji}</span>}
						<h3 className="folder-card-title">{folder.name}</h3>
					</div>

					{/* Tipo de tarjeta (al estilo Magic) */}
					<div className="folder-card-type-line">
						Carpeta {folder.totalFiles > 0 && `• ${folder.totalFiles} archivos`}
					</div>
				</div>

				{/* Cuerpo de la tarjeta */}
				<div className="folder-card-body">
					{folder.description && <p className="folder-card-description">{folder.description}</p>}

					{/* Lista de metadatos */}
					<div className="folder-card-metadata">
						{folder.totalSize > 0 && (
							<Fragment>
								<span className="folder-card-metadata-label">Tamaño:</span>
								<span className="folder-card-metadata-value">{formatFileSize(folder.totalSize)}</span>
							</Fragment>
						)}

						{folder.lastIndexed && (
							<Fragment>
								<span className="folder-card-metadata-label">Última indexación:</span>
								<span className="folder-card-metadata-value">{new Date(folder.lastIndexed).toLocaleDateString()}</span>
							</Fragment>
						)}

						{folder.path && (
							<Fragment>
								<span className="folder-card-metadata-label">Ruta:</span>
								<span className="folder-card-metadata-value folder-card-path">{folder.path}</span>
							</Fragment>
						)}
					</div>
				</div>

				{/* Pie de la tarjeta (al estilo Magic) */}
				<div className="folder-card-footer">
					<div className="folder-card-creator-line">
						<span>{`Creada: ${new Date(folder.createdAt).toLocaleDateString()}`}</span>
					</div>
				</div>
			</div>
		</EntityCardWrapper>
	);
}
