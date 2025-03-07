'use client';

import { getTagImages } from '@/app/actions/tag.actions';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { useFileManager } from '@/store/file-manager.store';
import type { FileItem } from '@/types/file-item';
import { TagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BaseContentView } from '../base/base-content-view';
import { ContentViewProvider } from '../base/content-view-provider';

export function TagContentView() {
	const { currentTagId } = useFileManager();
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadTagImages = async () => {
			if (!currentTagId) {
				return;
			}

			try {
				setIsLoading(true);
				const images = await getTagImages(currentTagId);
				setItems(images as unknown as FileItem[]);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Error desconocido');
			} finally {
				setIsLoading(false);
			}
		};

		loadTagImages();
	}, [currentTagId]);

	if (!currentTagId) {
		return (
			<EmptyState
				icon={TagIcon}
				title="No hay etiqueta seleccionada"
				description="Selecciona una etiqueta para ver su contenido"
			/>
		);
	}

	return (
		<ContentViewProvider
			items={items}
			isLoading={isLoading}
			error={error}
			currentContainerId={currentTagId}
			containerName="etiqueta"
			emptyState={{
				icon: TagIcon,
				title: 'No hay imágenes con esta etiqueta',
				description: 'Esta etiqueta no tiene imágenes asociadas',
			}}
		>
			<BaseContentView />
		</ContentViewProvider>
	);
}
