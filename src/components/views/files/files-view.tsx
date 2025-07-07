import { FileIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback } from 'react';
import { EntityCard } from '@/components/cards/entity-card';
import { EmptyState } from '@/components/core/data-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import type { EntityWithStats } from '@/types/migration';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('FilesView');

const MemoizedEntityCard = React.memo(
	({ file, onFileClick }: { file: EntityWithStats; onFileClick: () => void }) => (
		<EntityCard entity={file} onClick={onFileClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.file.id === nextProps.file.id &&
		prevProps.file.name === nextProps.file.name &&
		prevProps.file.updatedAt === nextProps.file.updatedAt
);
MemoizedEntityCard.displayName = 'MemoizedEntityCard';

/**
 * Vista principal de todos los archivos
 * Muestra una galería con todos los archivos (imágenes, documentos, etc.)
 */
export function FilesView({ className }: ViewProps) {
	const handleFileClick = useCallback((file: EntityWithStats) => {
		viewLogger.info('🖱️ Click en archivo:', file.name);
		// Lógica de navegación o apertura de visor aquí
	}, []);

	// Crear mock de archivos
	const mockFiles: EntityWithStats[] = React.useMemo(() => {
		return [
			{
				id: 'file-1',
				name: 'document.pdf',
				entityType: 'file',
				type: 'file' as const,
				size: 1024000,
				path: '/documents/document.pdf',
				createdAt: new Date(),
				updatedAt: new Date(),
				_count: { children: 0 }
			},
			{
				id: 'file-2',
				name: 'image.jpg',
				entityType: 'file',
				type: 'file' as const,
				size: 2048000,
				path: '/images/image.jpg',
				createdAt: new Date(),
				updatedAt: new Date(),
				_count: { children: 0 }
			},
			{
				id: 'file-3',
				name: 'presentation.pptx',
				entityType: 'file',
				type: 'file' as const,
				size: 5120000,
				path: '/presentations/presentation.pptx',
				createdAt: new Date(),
				updatedAt: new Date(),
				_count: { children: 0 }
			}
		];
	}, []);

	if (mockFiles.length === 0) {
		return (
			<EmptyState
				icon={FileIcon}
				title="No hay archivos"
				description="Indexa carpetas para comenzar a ver archivos."
			/>
		);
	}

	return (
		<div className={`h-full w-full ${className || ''}`}>
			<ScrollArea className="h-full">
				<div className="container mx-auto p-6">
					{/* Header con estadísticas */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="mb-6"
					>
						<h1 className="text-3xl font-bold text-foreground mb-2">
							📁 Todos los Archivos
						</h1>
						<p className="text-muted-foreground text-lg">
							{mockFiles.length} archivos encontrados
						</p>
					</motion.div>

					{/* Grid de archivos */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
					>
						{mockFiles.map((file, index) => (
							<motion.div
								key={file.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<MemoizedEntityCard
									file={file}
									onFileClick={() => handleFileClick(file)}
								/>
							</motion.div>
						))}
					</motion.div>
				</div>
			</ScrollArea>
		</div>
	);
}
