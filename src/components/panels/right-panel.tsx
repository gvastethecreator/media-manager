'use client';

import { DetailsPanel } from '@/components/panels/details/details-panel';
import { useFileManager } from '@/store/file-manager.store';
import type { ImageItem } from '@/types/image-item';
import { AnimatePresence, motion } from 'motion/react';

export function RightPanel() {
	const { selectedItems } = useFileManager();

	// Convertir FileItem[] a ImageItem[] asegurando compatibilidad
	const mappedItems: ImageItem[] = selectedItems.map((item) => ({
		id: item.id,
		name: item.name,
		path: item.path,
		url: item.thumbnail || undefined,
		metadata: item.metadata === null ? undefined : item.metadata,
		fileSize: item.size,
		width: item.width,
		height: item.height,
		tags: item.tags?.map((tag) => tag.name),
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
	}));

	return (
		<div className="flex flex-col h-full">
			<AnimatePresence mode="wait">
				{selectedItems.length > 0 ? (
					<DetailsPanel selectedItems={mappedItems} />
				) : (
					<motion.div
						key="info"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="flex-1"
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
					>
						<div className="flex-1 w-full h-full relative" />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
