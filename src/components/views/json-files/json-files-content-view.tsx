import { FileJson, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useJsonFileStore } from '@/store/entities/json-file';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import type { AnyEntityWithStats } from '@/types/entities';

// Logger para depuración
const logger = clientLogger.withContext('JsonFilesContentView');

interface JsonFilesContentViewProps {
	className?: string;
}

export function JsonFilesContentView({ className }: JsonFilesContentViewProps) {
	// Estados globales para panel de detalles y visor
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();
	const { jsonFiles, loading, error, fetchJsonFiles } = useJsonFileStore();

	// Estado local para controlar operaciones
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleJsonSelect = useCallback(
		(jsonFile: AnyEntityWithStats) => {
			logger.info('🖱️ Archivo JSON seleccionado:', jsonFile.name);

			// Mostrar panel de detalles con el archivo JSON seleccionado
			setSelectedItems([jsonFile]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const handleJsonDoubleClick = useCallback(
		(jsonFile: AnyEntityWithStats) => {
			const jsonItem = jsonFile as JsonFileWithStats;
			logger.info('🖱️ Doble click en archivo JSON:', jsonItem.name);

			// Obtener todos los archivos JSON para el visor
			const allJsons = jsonFiles;

			// Convertir a formato compatible con el visor (tipo ImageItem requerido por el store)
			const jsonItems = allJsons.map((j: JsonFileWithStats) => ({
				id: j.id,
				name: j.name,
				type: 'json' as const,
				path: j.path,
				size: j.size || 0,
				width: null,
				height: null,
				thumbnail: null,
				metadata: null,
			})) as any; // el visor opera con ImageItem; campos no aplicables se rellenan con null

			const currentIndex = jsonItems.findIndex((item: any) => item.id === jsonItem.id);

			// Abrir el visor con todos los archivos JSON
			openViewer(jsonItems, Math.max(0, currentIndex));
		},
		[jsonFiles, openViewer]
	);

	const handleRefresh = useCallback(async () => {
		if (isRefreshing) return;

		setIsRefreshing(true);
		logger.info('🔄 Refrescando archivos JSON');
		try {
			await fetchJsonFiles();
		} catch (refreshError) {
			logger.error('❌ Error al refrescar archivos JSON:', refreshError);
		} finally {
			setIsRefreshing(false);
		}
	}, [isRefreshing, fetchJsonFiles]);

	// ❌ Mostrar error si hay problemas
	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<EmptyState
					actions={
						<Button onClick={handleRefresh} variant="outline">
							Reintentar
						</Button>
					}
					description="Error al cargar los archivos JSON. Inténtalo de nuevo."
					icon={FileJson}
					title="Error al cargar archivos JSON"
				/>
			</div>
		);
	}

	// 🎯 Mostrar empty state si no hay archivos JSON
	if (!loading && jsonFiles.length === 0) {
		return (
			<BaseContentView
				className={className}
				description="Explora y gestiona tus archivos JSON"
				headerControls={
					<Button disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
						<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
						{isRefreshing ? 'Refrescando...' : 'Refrescar'}
					</Button>
				}
				title="Archivos JSON"
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Sube archivos JSON para comenzar a explorar su contenido."
						icon={FileJson}
						title="No hay archivos JSON"
					/>
				</div>
			</BaseContentView>
		);
	}

	// Renderizar vista de archivos JSON usando BaseContentView y FileBrowser
	return (
		<BaseContentView
			className={className}
			description="Explora y gestiona tus archivos JSON"
			headerControls={
				<Button disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
					<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
					{isRefreshing ? 'Refrescando...' : 'Refrescar'}
				</Button>
			}
			title="Archivos JSON"
		>
			<FileBrowser
				className="h-full"
				isLoading={loading}
				items={jsonFiles as unknown as AnyEntityWithStats[]}
				onItemClick={handleJsonSelect}
				onItemDoubleClick={handleJsonDoubleClick}
			/>
		</BaseContentView>
	);
}

export default JsonFilesContentView;
