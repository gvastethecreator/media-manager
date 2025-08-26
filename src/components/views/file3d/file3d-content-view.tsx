import { Box, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFile3DStore } from '@/store/entities/file3d';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { File3DWithStats } from '@/types/entities/file3d';
import type { AnyEntityWithStats } from '@/types/entities';

// Logger para depuración
const logger = clientLogger.withContext('File3DContentView');

interface File3DContentViewProps {
	className?: string;
}

export function File3DContentView({ className }: File3DContentViewProps) {
	// Estados globales para panel de detalles y visor
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();
	const { file3ds, loading, error, fetchFile3Ds } = useFile3DStore();

	// Estado local para controlar operaciones
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleFile3DSelect = useCallback(
		(file3d: AnyEntityWithStats) => {
			logger.info('🖱️ Archivo 3D seleccionado:', file3d.name);

			// Mostrar panel de detalles con el archivo 3D seleccionado
			setSelectedItems([file3d]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const handleFile3DDoubleClick = useCallback(
		(file3d: AnyEntityWithStats) => {
			const file3dItem = file3d as File3DWithStats;
			logger.info('🖱️ Doble click en archivo 3D:', file3dItem.name);

			// TODO: Implementar visor compatible con archivos 3D
			// Obtener todos los archivos 3D para el visor
			// const allFile3Ds = file3ds;

			// Convertir a formato compatible con el visor
			// const file3dItems = allFile3Ds.map((f: File3DWithStats) => ({
			//	id: f.id,
			//	name: f.name,
			//	type: 'file3d' as const,
			//	path: f.path,
			//	size: f.size || 0,
			// }));

			// const currentIndex = file3dItems.findIndex((item: any) => item.id === file3dItem.id);

			// Abrir el visor con todos los archivos 3D
			// openViewer(file3dItems, Math.max(0, currentIndex));
		},
		[file3ds, openViewer]
	);

	const handleRefresh = useCallback(async () => {
		if (isRefreshing) return;

		setIsRefreshing(true);
		logger.info('🔄 Refrescando archivos 3D');
		try {
			await fetchFile3Ds();
		} catch (refreshError) {
			logger.error('❌ Error al refrescar archivos 3D:', refreshError);
		} finally {
			setIsRefreshing(false);
		}
	}, [isRefreshing, fetchFile3Ds]);

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
					description="Error al cargar los archivos 3D. Inténtalo de nuevo."
					icon={Box}
					title="Error al cargar archivos 3D"
				/>
			</div>
		);
	}

	// 🎯 Mostrar empty state si no hay archivos 3D
	if (!loading && file3ds.length === 0) {
		return (
			<BaseContentView
				className={className}
				description="Explora y visualiza tus archivos 3D"
				headerControls={
					<Button disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
						<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
						{isRefreshing ? 'Refrescando...' : 'Refrescar'}
					</Button>
				}
				title="Archivos 3D"
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Sube archivos 3D para comenzar a usar el visor."
						icon={Box}
						title="No hay archivos 3D"
					/>
				</div>
			</BaseContentView>
		);
	}

	// Renderizar vista de archivos 3D usando BaseContentView y FileBrowser
	return (
		<BaseContentView
			className={className}
			description="Explora y visualiza tus archivos 3D"
			headerControls={
				<Button disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
					<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
					{isRefreshing ? 'Refrescando...' : 'Refrescar'}
				</Button>
			}
			title="Archivos 3D"
		>
			<FileBrowser
				className="h-full"
				isLoading={loading}
				items={file3ds as unknown as AnyEntityWithStats[]}
				onItemClick={handleFile3DSelect}
				onItemDoubleClick={handleFile3DDoubleClick}
			/>
		</BaseContentView>
	);
}

export default File3DContentView;
