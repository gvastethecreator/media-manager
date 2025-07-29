/**
 * @file MultiEntityViewer component for viewing different types of entities
 * @module components/features/file-viewer/multi-entity-viewer
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EntityStatsType } from '@/types/migration';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ImageWithStats } from '@/types/entities/image';
import type { VideoWithStats } from '@/types/entities/video';
import type { AudioWithStats } from '@/types/entities/audio';
import type { DocumentWithStats } from '@/types/entities/document';
import type { FileWithStats } from '@/types/entities/file/base';

// Import viewers
import { FileViewer } from './file-viewer'; // For images
import { VideoViewer } from './viewers/video-viewer';
import { AudioViewer } from './viewers/audio-viewer';
import { DocumentViewer } from './viewers/document-viewer';
import { GenericFileViewer } from './viewers/generic-file-viewer';

interface MultiEntityViewerProps {
  entities: AnyEntityWithStats[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function MultiEntityViewer({
  entities,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange
}: MultiEntityViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const currentEntity = entities[currentIndex];
  
  // Navigation functions
  const handleNext = () => {
    const nextIndex = currentIndex < entities.length - 1 ? currentIndex + 1 : 0;
    onIndexChange(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : entities.length - 1;
    onIndexChange(prevIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose]);

  // Determine which viewer to render based on entity type
  const renderViewer = () => {
    if (!currentEntity) return null;

    switch (currentEntity.type) {
      case EntityStatsType.IMAGE:
        // For images, use the existing FileViewer component
        const imageEntities = entities.filter(e => e.type === EntityStatsType.IMAGE) as ImageWithStats[];
        const imageIndex = imageEntities.findIndex(img => img.id === currentEntity.id);
        return (
          <FileViewer
            images={imageEntities}
            currentIndex={imageIndex >= 0 ? imageIndex : 0}
            isOpen={isOpen}
            onClose={onClose}
          />
        );

      case EntityStatsType.VIDEO:
        return (
          <VideoViewer
            video={currentEntity as VideoWithStats}
            onClose={onClose}
            onNext={handleNext}
            onPrevious={handlePrevious}
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

      case EntityStatsType.FOLDER:
      case EntityStatsType.TAG:
      case EntityStatsType.COLLECTION:
      case EntityStatsType.ALBUM:
      default:
        // For unsupported types or generic files, use GenericFileViewer
        return (
          <GenericFileViewer
            file={currentEntity as FileWithStats}
            onClose={onClose}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
    }
  };

  // Don't render if not open or no entities
  if (!isOpen || !entities?.length || !currentEntity) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-background"
        >
          {renderViewer()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export individual viewers for direct use
export { VideoViewer } from './viewers/video-viewer';
export { AudioViewer } from './viewers/audio-viewer';
export { DocumentViewer } from './viewers/document-viewer';
export { GenericFileViewer } from './viewers/generic-file-viewer';

// Re-export the original FileViewer for backward compatibility
export { FileViewer } from './file-viewer';