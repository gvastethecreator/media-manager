'use client';

import { formatBytes } from '@/lib/utils/utils';
import { FileImage, HardDrive, ImageIcon, Info, Maximize2, Palette } from 'lucide-react';
import * as React from 'react';
import { InfoItem } from './details-panel-info-item';
import type { ItemWithMetadataProps } from './details-panel-types';

/**
 * Componente que muestra información básica del archivo
 */
export function BasicInfo({ item, metadata }: ItemWithMetadataProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<InfoItem icon={<FileImage className="h-3.5 w-3.5 text-blue-400" />} label="Nombre" value={item.name} />
			<InfoItem
				icon={<ImageIcon className="h-3.5 w-3.5 text-green-400" />}
				label="Tipo"
				value={metadata?.mimeType?.split('/')[1] || 'Desconocido'}
			/>
			<InfoItem
				icon={<HardDrive className="h-3.5 w-3.5 text-purple-400" />}
				label="Tamaño"
				value={formatBytes(item.size)}
			/>
			{metadata?.dimensions && (
				<InfoItem
					icon={<Maximize2 className="h-3.5 w-3.5 text-yellow-400" />}
					label="Dimensiones"
					value={`${metadata.dimensions.width} × ${metadata.dimensions.height}`}
				/>
			)}
			{metadata?.colorSpace && (
				<InfoItem
					icon={<Palette className="h-3.5 w-3.5 text-orange-400" />}
					label="Espacio de color"
					value={metadata.colorSpace}
				/>
			)}
			{metadata?.hasAlpha && (
				<InfoItem icon={<Info className="h-3.5 w-3.5 text-indigo-400" />} label="Canal alfa" value="Sí" />
			)}
			{metadata?.isAnimated && (
				<InfoItem icon={<FileImage className="h-3.5 w-3.5 text-pink-400" />} label="Animada" value="Sí" />
			)}
		</div>
	);
}
