/**
 * @file MultiEntityViewer component for viewing different types of entities
 * @module components/features/file-viewer/multi-entity-viewer
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from '@/components/ui/animejs-shim';
import type { AnyEntityWithStats } from '@/types/entities';
import type { AudioWithStats } from '@/types/entities/audio';
import type { DocumentWithStats } from '@/types/entities/document';
import type { FileWithStats } from '@/types/entities/file/base';
import type { VideoWithStats } from '@/types/entities/video';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

// Import viewers
import { AudioViewer } from './viewers/audio-viewer';
import { DocumentViewer } from './viewers/document-viewer';
import { GenericFileViewer } from './viewers/generic-file-viewer';
import { VideoViewer } from './viewers/video-viewer';

interface MultiEntityViewerProps {
	entities: AnyEntityWithStats[];
	currentIndex: number;
	isOpen: boolean;
	onClose: () => void;
	onIndexChange: (index: number) => void;
}

export function MultiEntityViewer({ entities, currentIndex, isOpen, onClose, onIndexChange }: MultiEntityViewerProps) {
	const [isLoading, setIsLoading] = useState(false);

	const currentEntity = entities[currentIndex];

	// Navigation functions
	const handleNext = useCallback(() => {
		const nextIndex = currentIndex < entities.length - 1 ? currentIndex + 1 : 0;
		onIndexChange(nextIndex);
	}, [currentIndex, entities.length, onIndexChange]);

	const handlePrevious = useCallback(() => {
		const prevIndex = currentIndex > 0 ? currentIndex - 1 : entities.length - 1;
		onIndexChange(prevIndex);
	}, [currentIndex, entities.length, onIndexChange]);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			} else if (e.key === 'ArrowLeft') {
				handlePrevious();
			} else if (e.key === 'ArrowRight') {
				handleNext();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose, handleNext, handlePrevious]);

	// Determine which viewer to render based on entityType discriminator
	const renderViewer = () => {
		if (!currentEntity) {
			return null;
		}

		switch (currentEntity.entityType as EntityStatsType) {
			case EntityStatsType.IMAGE: {
				// Mostrar viewer genérico de archivo cuando el FileViewer no acepta props de imágenes según tipos
				return (
					<GenericFileViewer
						file={currentEntity as unknown as FileWithStats}
						onClose={onClose}
						onNext={handleNext}
						onPrevious={handlePrevious}
					/>
				);
			}

			case EntityStatsType.VIDEO:
				// Ajuste de tipos: evitar pasar onClose directamente si no está en VideoViewerProps
				return (
					<VideoViewer
						video={currentEntity as VideoWithStats}
						{...({ onNext: handleNext, onPrevious: handlePrevious } as any)}
					/>
				);

			case EntityStatsType.AUDIO:
				return (
					<AudioViewer
						audio={currentEntity as AudioWithStats}
						onClose={onClose}
						onNext={handleNext}
						onPrevious={handlePrevious}
					/>
				);

			case EntityStatsType.DOCUMENT:
				return (
					<DocumentViewer
						document={currentEntity as DocumentWithStats}
						onClose={onClose}
						onNext={handleNext}
						onPrevious={handlePrevious}
					/>
				);

			default:
				// For unsupported types or generic files, use GenericFileViewer
				return (
					<GenericFileViewer
						file={currentEntity as unknown as FileWithStats}
						onClose={onClose}
						onNext={handleNext}
						onPrevious={handlePrevious}
					/>
				);
		}
	};

	// Don't render if not open or no entities
	if (!(isOpen && entities?.length && currentEntity)) {
		return null;
	}

	return (
		<AnimatePresence mode="wait">
			{isOpen && (
				<motion.div
					animate={{ opacity: 1 }}
					className="fixed inset-0 z-[9999] bg-background"
					exit={{ opacity: 0 }}
					initial={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
				>
					{renderViewer()}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// Re-export the original FileViewer for backward compatibility
export { FileViewer } from './file-viewer';
export { AudioViewer } from './viewers/audio-viewer';
export { DocumentViewer } from './viewers/document-viewer';
export { GenericFileViewer } from './viewers/generic-file-viewer';
// Export individual viewers for direct use
export { VideoViewer } from './viewers/video-viewer';
