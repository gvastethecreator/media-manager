'use client';

import { JsonFileCard } from '@/components/cards/json-file-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useJsonFileStore } from '@/store/entities/json-file';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import { FileJson } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('JsonFilesView');

const MemoizedJsonFileCard = React.memo(
	({ jsonFile, onJsonFileClick }: { jsonFile: JsonFileWithStats; onJsonFileClick: () => void }) => (
		<JsonFileCard jsonFile={jsonFile} onClick={onJsonFileClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.jsonFile.id === nextProps.jsonFile.id &&
		prevProps.jsonFile.name === nextProps.jsonFile.name &&
		prevProps.jsonFile.updatedAt === nextProps.jsonFile.updatedAt,
);
MemoizedJsonFileCard.displayName = 'MemoizedJsonFileCard';

/**
 * Vista de archivos JSON
 * Muestra una lista de archivos JSON con cards TCG y soporte para edición/visualización.
 */
export function JsonFilesView(_props: ViewProps) {
	const {
		jsonFiles: jsonFilesRecord,
		loading: isLoading,
		error,
		fetchJsonFiles: loadJsonFiles,
	} = useJsonFileStore((s) => ({
		jsonFiles: s.jsonFiles,
		loading: s.loading,
		error: s.error,
		fetchJsonFiles: s.fetchJsonFiles,
	}));

	useEffect(() => {
		if (Array.isArray(jsonFilesRecord) && jsonFilesRecord.length === 0) {
			viewLogger.info('Store de archivos JSON vacío, cargando desde el servidor...');
			loadJsonFiles();
		}
	}, [loadJsonFiles, jsonFilesRecord]);

	const handleJsonFileClick = useCallback((jsonFile: JsonFileWithStats) => {
		viewLogger.info('🖱️ Click en archivo JSON:', jsonFile.name);
		// Lógica de navegación o apertura de editor JSON aquí
	}, []);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && (!Array.isArray(jsonFilesRecord) || jsonFilesRecord.length === 0)) {
		return <LoadingScreen />;
	}

	// Lógica de ordenamiento simple (por fecha de actualización, más recientes primero)
	const sortedJsonFiles = Array.isArray(jsonFilesRecord) ? jsonFilesRecord.sort((a, b) =>
		new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
	) : [];

	if (sortedJsonFiles.length === 0) {
		return (
			<EmptyState
				icon={FileJson}
				title="No hay archivos JSON"
				description="Sube archivos JSON para comenzar a usar el editor y visor."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{sortedJsonFiles.map((jsonFile, index) => {
						const onJsonFileClick = () => handleJsonFileClick(jsonFile);
						return (
							<motion.div
								key={jsonFile.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-json-file-id={jsonFile.id}
								>
									<MemoizedJsonFileCard jsonFile={jsonFile} onJsonFileClick={onJsonFileClick} />
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada que usa JsonFileCard TCG con efectos holográficos
 * - Integra store Zustand para gestión de estado
 * - Soporte para validación JSON en tiempo real
 * - Preview expandible del contenido con estadísticas
 * - Animaciones fluidas con motion/react
 * - Lazy loading y memoización para rendimiento
 */
