/**
 * @file Vista de contenido mixto - Ejemplo de uso del FileBrowser multi-entidad
 * @module components/views/mixed/mixed-content-view
 * @description Demuestra cómo usar el FileBrowser con múltiples tipos de entidades
 */

import { FileSearch, Layers, RefreshCw } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/loading';
import { IntegratedFileBrowser } from '@/components/features/file-browser';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clientLogger } from '@/lib/logger/client-logger';
import type { EntityStatsType, EntityWithStats } from '@/types/migration';

const logger = clientLogger.withContext('MixedContentView');

interface MixedContentViewProps {
	/** ID de carpeta para filtrar contenido */
	folderId?: string;
	/** Callback cuando se selecciona un item */
	onItemSelect?: (item: EntityWithStats) => void;
	/** Callback cuando se hace doble click en un item */
	onItemDoubleClick?: (item: EntityWithStats) => void;
}

export const MixedContentView = memo<MixedContentViewProps>(function MixedContentView({
	folderId,
	onItemSelect,
	onItemDoubleClick,
}) {
	const [activeTab, setActiveTab] = useState<'all' | 'media' | 'documents' | 'creative'>('all');
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Configuraciones de entidades por pestaña
	const tabConfigurations = {
		all: {
			entityTypes: ['image', 'video', 'audio', 'document', 'note', 'concept'] as EntityStatsType[],
			title: 'Todo el contenido',
			description: 'Todos los tipos de entidades en una vista unificada',
		},
		media: {
			entityTypes: ['image', 'video', 'audio'] as EntityStatsType[],
			title: 'Archivos multimedia',
			description: 'Imágenes, videos y archivos de audio',
		},
		documents: {
			entityTypes: ['document', 'note'] as EntityStatsType[],
			title: 'Documentos y notas',
			description: 'Documentos, PDFs y notas de texto',
		},
		creative: {
			entityTypes: ['concept', 'character', 'world-item'] as EntityStatsType[],
			title: 'Contenido creativo',
			description: 'Conceptos, personajes y elementos del mundo',
		},
	};

	const currentConfig = tabConfigurations[activeTab];

	// Manejar refresco de datos
	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		logger.info('🔄 Refrescando vista de contenido mixto');

		try {
			// Simular refresco (en una implementación real, recargarías los stores)
			await new Promise(resolve => setTimeout(resolve, 1000));
			logger.info('✅ Vista de contenido mixto refrescada');
		} catch (error) {
			logger.error('❌ Error al refrescar vista mixta:', error);
		} finally {
			setIsRefreshing(false);
		}
	}, []);

	// Callbacks optimizados
	const handleItemSelect = useCallback(
		(item: EntityWithStats) => {
			logger.debug('📋 Item seleccionado en vista mixta:', {
				id: item.id,
				type: 'entityType' in item ? item.entityType : 'unknown'
			});
			onItemSelect?.(item);
		},
		[onItemSelect]
	);

	const handleItemDoubleClick = useCallback(
		(item: EntityWithStats) => {
			logger.debug('🖱️ Doble click en item de vista mixta:', {
				id: item.id,
				type: 'entityType' in item ? item.entityType : 'unknown'
			});
			onItemDoubleClick?.(item);
		},
		[onItemDoubleClick]
	);

	if (isRefreshing) {
		return <LoadingScreen message="Refrescando contenido mixto..." />;
	}

	return (
		<div className="flex h-full w-full flex-col bg-background">
			{/* Header con controles */}
			<div className="flex items-center justify-between border-b border-border p-4">
				<div className="flex items-center gap-2">
					<Layers className="h-5 w-5 text-muted-foreground" />
					<div>
						<h2 className="text-lg font-semibold">{currentConfig.title}</h2>
						<p className="text-sm text-muted-foreground">{currentConfig.description}</p>
					</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleRefresh}
					disabled={isRefreshing}
					className="gap-2"
				>
					<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
					Refrescar
				</Button>
			</div>

			{/* Pestañas de configuración */}
			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
				<div className="border-b border-border px-4">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="all">Todo</TabsTrigger>
						<TabsTrigger value="media">Media</TabsTrigger>
						<TabsTrigger value="documents">Documentos</TabsTrigger>
						<TabsTrigger value="creative">Creativo</TabsTrigger>
					</TabsList>
				</div>

				{/* Contenido de las pestañas */}
				<TabsContent value={activeTab} className="flex-1 overflow-hidden">
					<IntegratedFileBrowser
						entityType="mixed"
						entityTypes={currentConfig.entityTypes}
						filterId={folderId}
						filterType={folderId ? 'folder' : undefined}
						onItemSelect={handleItemSelect}
						onItemDoubleClick={handleItemDoubleClick}
						showToolbar={true}
						className="h-full"
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
});

/**
 * 📝 Ejemplo de uso avanzado:
 *
 * Este componente demuestra las capacidades del FileBrowser multi-entidad:
 *
 * 1. **Pestañas dinámicas**: Diferentes configuraciones de entityTypes
 * 2. **Filtrado por carpeta**: Opcional, mantiene consistencia
 * 3. **Toolbar integrado**: Funciona con cualquier combinación de entidades
 * 4. **Callbacks unificados**: Maneja diferentes tipos de entidades de forma consistente
 * 5. **Estados de carga**: Gestión independiente del estado del FileBrowser
 *
 * Casos de uso:
 * - Vista de carpeta con contenido mixto
 * - Dashboard de diferentes tipos de contenido
 * - Explorador de archivos unificado
 * - Vista de resultados de búsqueda multi-tipo
 */