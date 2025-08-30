import { FileText, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useDocumentStore } from '@/store/entities/document';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import type { DocumentWithStats } from '@/types/entities/document';

// Logger para depuración
const logger = clientLogger.withContext('DocumentsContentView');

interface DocumentsContentViewProps {
	className?: string;
}

export function DocumentsContentView({ className }: DocumentsContentViewProps) {
	// Estados globales para panel de detalles y visor
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();
	const { documents, isLoading, error, fetchDocuments } = useDocumentStore();

	// Convertir el objeto documents a array para compatibilidad con FileBrowser
	const documentsArray = Object.values(documents);

	// Estado local para controlar operaciones
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleDocumentSelect = useCallback(
		(document: AnyEntityWithStats) => {
			logger.info('🖱️ Documento seleccionado:', document.name);

			// Mostrar panel de detalles con el documento seleccionado
			setSelectedItems([document]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const handleDocumentDoubleClick = useCallback((document: AnyEntityWithStats) => {
		const docItem = document as DocumentWithStats;
		logger.info('🖱️ Doble click en documento:', docItem.name);

		// TODO: Implementar visor compatible con documentos
		// Obtener todos los documentos para el visor
		// const allDocuments = documentsArray;

		// Convertir a formato compatible con el visor
		// const docItems = allDocuments.map((d: DocumentWithStats) => ({
		//	id: d.id,
		//	name: d.name,
		//	type: 'document' as const,
		//	path: d.path,
		//	size: d.size || 0,
		// }));

		// const currentIndex = docItems.findIndex((item: any) => item.id === docItem.id);

		// Abrir el visor con todos los documentos
		// openViewer(docItems, Math.max(0, currentIndex));
	}, []);

	const handleRefresh = useCallback(async () => {
		if (isRefreshing) return;

		setIsRefreshing(true);
		logger.info('🔄 Refrescando documentos');
		try {
			await fetchDocuments();
		} catch (refreshError) {
			logger.error('❌ Error al refrescar documentos:', refreshError);
		} finally {
			setIsRefreshing(false);
		}
	}, [isRefreshing, fetchDocuments]);

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
					description="Error al cargar los documentos. Inténtalo de nuevo."
					icon={FileText}
					title="Error al cargar documentos"
				/>
			</div>
		);
	}

	// 🎯 Mostrar empty state si no hay documentos
	if (!isLoading && documentsArray.length === 0) {
		return (
			<BaseContentView
				className={className}
				description="Explora y gestiona tus documentos"
				headerControls={
					<Button disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
						<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
						{isRefreshing ? 'Refrescando...' : 'Refrescar'}
					</Button>
				}
				title="Documentos"
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Sube documentos para comenzar a usar el visor y editor."
						icon={FileText}
						title="No hay documentos"
					/>
				</div>
			</BaseContentView>
		);
	}

	// Renderizar vista de documentos usando BaseContentView y FileBrowser
	return (
		<BaseContentView
			className={className}
			description="Explora y gestiona tus documentos"
			headerControls={
				<Button disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
					<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
					{isRefreshing ? 'Refrescando...' : 'Refrescar'}
				</Button>
			}
			title="Documentos"
		>
			<FileBrowser
				className="h-full"
				isLoading={isLoading}
				items={documentsArray as unknown as AnyEntityWithStats[]}
				onItemClick={handleDocumentSelect}
				onItemDoubleClick={handleDocumentDoubleClick}
			/>
		</BaseContentView>
	);
}

export default DocumentsContentView;
