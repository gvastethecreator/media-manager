'use client';

import type { Folder } from '@prisma/client';
import { useEffect, useState } from 'react';
import { BaseCard } from './base-card';
import type { CardOptions } from './types/card-settings-types';

interface FolderCardProps {
	folder: Folder;
	onClick?: (folder: Folder) => void;
	showVisualConfig?: boolean;
	enableExplode?: boolean;
	visualOptions?: CardOptions;
}

export function FolderCard({
	folder,
	onClick,
	showVisualConfig = false,
	enableExplode = false,
	visualOptions = {},
}: FolderCardProps) {
	const [folderVisualConfig, setFolderVisualConfig] = useState<CardOptions | null>(null);

	useEffect(() => {
		const loadFolderVisualConfig = async () => {
			try {
				const response = await fetch(`/api/entities/folders/${folder.id}/visual-config`);
				if (!response.ok) {
					if (response.status !== 404) {
						throw new Error('Error al cargar la configuración visual de la carpeta');
					}
					return; // Si no hay configuración específica, usar la configuración por defecto
				}
				const config = await response.json();
				setFolderVisualConfig(config);
			} catch (error) {
				console.error('Error al cargar la configuración visual de la carpeta:', error);
			}
		};

		if (showVisualConfig) {
			loadFolderVisualConfig();
		}
	}, [folder.id, showVisualConfig]);

	// Combinar la configuración visual por defecto con la específica de la carpeta
	const mergedVisualOptions = {
		...visualOptions,
		...folderVisualConfig,
	};

	return (
		<BaseCard
			title={folder.name}
			description={folder.description || ''}
			onClick={() => onClick?.(folder)}
			showVisualConfig={showVisualConfig}
			enableExplode={enableExplode}
			visualOptions={mergedVisualOptions}
		/>
	);
}