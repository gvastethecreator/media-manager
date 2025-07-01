'use client';

import { EntityCard } from '@/components/cards/entity-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button, buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import * as folderService from '@/services/folder/folder.service';
import { useFileStoreBase } from '@/store/entities/file';
import { useFolderStore } from '@/store/entities/folder';
import type { FolderWithStats } from '@/types/entities/folder';
import { DatabaseIcon, FolderIcon, RefreshCw, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ViewProps } from '../../types';

const viewLogger = clientLogger.withContext('FoldersView');

// Extender FolderWithStats para asegurar compatibilidad con EntityCard
type FolderEntity = FolderWithStats & {
	entityType: 'folder';
	_count?: {
		images: number;
	};
	totalSize: number;
	totalFiles: number;
};

const MemoizedEntityCard = React.memo(
	({ folder, onFolderClick }: { folder: FolderEntity; onFolderClick: () => void }) => (
		<EntityCard entity={folder} onClick={onFolderClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.folder.id === nextProps.folder.id &&
		prevProps.folder.name === nextProps.folder.name &&
		prevProps.folder.updatedAt === nextProps.folder.updatedAt &&
		(prevProps.folder._count?.images || 0) === (nextProps.folder._count?.images || 0) &&
		prevProps.folder.totalSize === nextProps.folder.totalSize &&
		prevProps.folder.totalFiles === nextProps.folder.totalFiles
);
MemoizedEntityCard.displayName = 'MemoizedEntityCard';

export function FoldersView(_props: ViewProps) {
	const { setCurrentView, setCurrentItem } = useNavigationStore();

	// 🆕 Usar los nuevos stores específicos
	const { selectFolder, getFolder } = useFolderStore();

	// 🧹 Para limpiar selección - usar el hook base directamente
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);

	const [folders, setFolders] = useState<FolderEntity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el nuevo hook de eventos optimistas del cliente
	const [optimisticFolders, _addEvent] = clientEvents.useEvents<FolderEntity[]>(folders);
	// Mantener un contador de reintentos
	const [retryCount, setRetryCount] = useState(0);
	const [isManualRetry, setIsManualRetry] = useState(false);
	const maxRetries = 3;

	const loadFolders = useCallback(
		async (isManual = false) => {
			try {
				if (isManual) {
					setIsManualRetry(true);
				}
				setIsLoading(true);
				viewLogger.info('🔄 Cargando carpetas...');
				const data = await folderService.getFoldersWithStats();

				// ✅ Transformar datos para EntityCard - ahora los datos ya vienen con estadísticas
				if (Array.isArray(data)) {
					const transformedData = data.map((folderData: FolderWithStats): FolderEntity => {
						return {
							...folderData,
							entityType: 'folder', // 🆕 Requerido para EntityCard
							lastIndexed: folderData.lastIndexed ? new Date(folderData.lastIndexed) : null,
							createdAt: new Date(folderData.createdAt),
							updatedAt: new Date(folderData.updatedAt),
							// Las estadísticas ya vienen del servicio, no necesitamos modificarlas
							// _count ya viene del transformer
							// totalSize y totalFiles ya vienen del transformer
						};
					});

					setFolders(transformedData);
					setRetryCount(0);
					setError(null);
					viewLogger.info(`✅ ${transformedData.length} carpetas cargadas`);
				} else {
					throw new Error('Respuesta del servicio no es un array válido');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

				// Gestionar los casos de errores de concurrencia o transitorios solo en carga automática
				const isTransientError =
					(errorMessage.includes('Operación') && errorMessage.includes('en progreso')) ||
					errorMessage.includes('ECONNREFUSED') ||
					errorMessage.includes('timeout') ||
					errorMessage.includes('network');

				if (isTransientError && retryCount < maxRetries && !isManual) {
					// Calcular retraso de reintento exponencial (300ms, 900ms, 2700ms)
					const retryDelay = 300 * 3 ** retryCount;
					viewLogger.debug(
						`🔄 Error transitorio, reintentando en ${retryDelay}ms (intento ${retryCount + 1}/${maxRetries})...`
					);

					// Incrementar contador de reintentos y programar un nuevo intento
					setRetryCount((prev) => prev + 1);
					setTimeout(() => {
						loadFolders(false);
					}, retryDelay);
					return;
				}

				// Si hemos alcanzado el máximo de reintentos o no es un error transitorio, mostrar el error
				if (retryCount >= maxRetries && !isManual) {
					viewLogger.warn(`⚠️ Alcanzado máximo de reintentos (${maxRetries})`);
				}

				viewLogger.error('❌ Error cargando carpetas:', error);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
				if (isManual) {
					setIsManualRetry(false);
				}
			}
		},
		[retryCount, isManualRetry]
	);

	useEffect(() => {
		viewLogger.debug('🟢 FoldersView Montado');
		// Solo cargar automáticamente si no hay carpetas y no estamos cargando
		if (folders.length === 0 && !isLoading) {
			loadFolders(false);
		}

		return () => {
			viewLogger.debug('🔴 FoldersView Desmontado');
		};
	}, []); // Solo ejecutar una vez al montar

	const handleFolderClick = useCallback(
		(folder: FolderEntity) => {
			try {
				viewLogger.info('🖱️ Click en carpeta:', folder.name);
				viewLogger.debug('ℹ️ Carpeta clickeada:', folder);

				// Verificaciones de seguridad
				if (!folder || !folder.id) {
					viewLogger.error('❌ Carpeta inválida:', folder);
					return;
				}

				viewLogger.debug('🧹 Limpiando selecciones previas...');
				// 🧹 Limpiar selecciones previas
				deselectAllFiles();
				viewLogger.debug('✅ Selecciones limpiadas.');

				viewLogger.debug('🔄 Actualizando el store de carpetas (selectFolder)...');
				// 🔄 Actualizar el store de carpetas PRIMERO
				selectFolder(folder.id);
				viewLogger.debug(`✅ selectFolder llamado con ID: ${folder.id}`);

				viewLogger.debug('📋 Estableciendo elemento actual en navigation store...');
				// 📋 Establecer el elemento actual en el navigation store
				setCurrentItem({
					id: folder.id,
					name: folder.name,
					path: folder.path,
					description: folder.description || undefined,
					color: folder.color || undefined,
					emoji: folder.emoji || undefined,
					count: folder._count?.images || 0,
					totalSize: folder.totalSize,
					lastIndexed: folder.lastIndexed || undefined,
					createdAt: folder.createdAt,
					itemType: 'folder',
				});
				viewLogger.debug('✅ setCurrentItem llamado con datos de carpeta.');

				viewLogger.debug('📍 Actualizando la vista de navegación (setCurrentView)...');
				// 📍 Actualizar la vista de navegación
				setCurrentView('folder-content');
				viewLogger.debug('✅ setCurrentView llamado a folder-content.');

				viewLogger.info(`✅ Navegando a carpeta: ${folder.name} (${folder.id})`);
			} catch (error) {
				viewLogger.error('❌ Error al cambiar a la carpeta:', error);
			}
		},
		[setCurrentView, setCurrentItem, deselectAllFiles, selectFolder]
	);

	// Función para reintento manual
	const handleManualRetry = useCallback(() => {
		setRetryCount(0); // Resetear contador para reintento manual
		loadFolders(true);
	}, [loadFolders]);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-6">
				<div className="max-w-md w-full bg-destructive/10 rounded-lg p-6 text-center">
					<XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
					<h3 className="text-xl font-semibold text-destructive mb-2">Error al cargar carpetas</h3>
					<p className="text-sm mb-4">{error}</p>
					<p className="text-xs text-muted-foreground mb-4">
						Este error podría estar relacionado con problemas de conexión a la base de datos o problemas con la
						estructura de tablas.
					</p>
					<div className="flex flex-col gap-2">
						<Button variant="outline" onClick={handleManualRetry}>
							<RefreshCw className="h-4 w-4 mr-2" />
							Reintentar
						</Button>
						<Link to="/diagnostics/database" className={buttonVariants({ variant: 'default' })}>
							<DatabaseIcon className="h-4 w-4 mr-2" />
							Ejecutar diagnóstico
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!optimisticFolders || optimisticFolders.length === 0) {
		return (
			<EmptyState
				icon={FolderIcon}
				title="No hay carpetas indexadas"
				description="Agrega carpetas desde el panel de configuración para comenzar a indexar tus imágenes."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				{/* Header con estadísticas */}
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-foreground mb-2">Carpetas</h2>
					<p className="text-muted-foreground">
						{optimisticFolders.length} {optimisticFolders.length === 1 ? 'carpeta' : 'carpetas'} indexadas
					</p>
				</div>

				{/* Grid de carpetas */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
					{optimisticFolders.map((folder, index) => {
						// Verificar que la carpeta tenga un id válido
						if (!folder || !folder.id) {
							console.error('Carpeta sin id válido:', folder);
							return null;
						}

						// Crear una función de clic específica para esta carpeta
						const onFolderClick = () => handleFolderClick(folder);

						return (
							<motion.div
								key={folder.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: index * 0.1,
									duration: 0.4,
									type: 'spring',
									stiffness: 100,
									damping: 12,
								}}
								className="perspective-1000"
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-folder-id={folder.id}
								>
									<MemoizedEntityCard folder={folder} onFolderClick={onFolderClick} />
								</div>
							</motion.div>
						);
					})}
				</div>

				{/* Footer con información adicional */}
				{optimisticFolders.length > 0 && (
					<div className="mt-8 pt-6 border-t border-border">
						<p className="text-sm text-muted-foreground text-center">
							Mostrando {optimisticFolders.length} {optimisticFolders.length === 1 ? 'carpeta' : 'carpetas'}
						</p>
					</div>
				)}
			</div>
		</ScrollArea>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada que usa EntityCard TCG con efectos holográficos
 * - Integra store Zustand para gestión eficiente de estado
 * - Grid responsivo que se adapta a diferentes tamaños de pantalla
 * - Animaciones escalonadas para carga suave
 * - Lazy loading y memoización para rendimiento óptimo
 * - Consistente con las otras 19 vistas del sistema
 * - Estadísticas y información contextual
 */
