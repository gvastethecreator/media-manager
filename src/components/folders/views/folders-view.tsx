'use client';

import { getFolders } from '@/app/actions/folders/folder-crud.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { getCardOptionsFromPreset } from '@/components/features/entity-cards/actions/visual-presets.actions';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardDesignPreset, CardOptions, CornerStyle } from '@/components/features/entity-cards/types/base-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
import type { Folder } from '@/types/entities/folders';
import { FolderIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../../views/types';

const viewLogger = serverLogger.withContext('FoldersView');

// Configuración visual mejorada para carpetas tipo TCG (Trading Card Game)
const DEFAULT_FOLDER_OPTIONS: CardOptions = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño inspirado en cartas coleccionables
	designSystem: {
		preset: 'folder' as CardDesignPreset,
		variant: 'tcg',
		aspectRatio: '7/10', // Proporción estándar de cartas coleccionables
		cornerStyle: 'rounded' as CornerStyle,
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'dramatic',
	},

	// Efectos holográficos y de brillo
	holographicOptions: {
		patternType: 'rainbow',
		intensity: 0.6,
		animationSpeed: 1.5,
		visibleOnHover: true,
	},

	// Efectos de brillo
	glowOptions: {
		intensity: 0.7,
		size: 25,
		blurAmount: 18,
		animationType: 'pulse',
		pulseSpeed: 2,
		color: 'auto', // Toma el color de la rareza
		visibleOnHover: true,
	},

	// Bordes animados
	borderOptions: {
		width: 2.5,
		pattern: 'gradient',
		animationType: 'flow',
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.8,
	},

	// Textura de fondo
	textureConfig: {
		type: 'noise',
		intensity: 0.15,
		scale: 1.2,
		blendMode: 'overlay',
	},

	// Rareza - será sobrescrita por cada carpeta
	rarityConfig: {
		enabled: true,
		rarity: 'common',
		color: '#4b5563',
		borderColor: 'rgba(75, 85, 99, 0.7)',
		glowColor: 'rgba(75, 85, 99, 0.5)',
		borderStyle: 'solid',
		borderWidth: 2,
		frameType: 'standard',
	},

	// Configuración de animación
	animation: {
		hoverEffect: 'lift',
		entranceAnimation: 'fade-in',
		hoverScale: 1.05,
		hoverRotation: true,
		hoverLightEffect: true,
		maxRotation: 15,
	},

	// Colores base
	primaryColor: '#3b82f6',
	secondaryColor: '#1e40af',
	accentColor: '#60a5fa',
	backgroundColor: '#1e293b',
};

export function FoldersView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentFolder, clearSelection } = useFileManager();
	const [folders, setFolders] = useState<Folder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_FOLDER_OPTIONS);
	// Nuevo estado para almacenar presets de carpetas
	const [folderPresets, setFolderPresets] = useState<Record<string, CardOptions>>({});

	// Usar el nuevo hook de eventos optimistas del cliente
	const [optimisticFolders, _addEvent] = clientEvents.useEvents<Folder[]>(folders);

	// Función para cargar la configuración de un preset
	const loadPresetConfig = useCallback(async (presetId: string): Promise<CardOptions | null> => {
		try {
			const response = await getCardOptionsFromPreset(presetId, 'folder');
			if (response.success && response.data) {
				return response.data as CardOptions;
			}
			return null;
		} catch (error) {
			viewLogger.error('❌ Error cargando preset:', error);
			return null;
		}
	}, []);

	const loadFolders = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando carpetas...');
			const data = await getFolders();
			const transformedData = data.map((folderData) => {
				return {
					...folderData,
					lastIndexed: folderData.lastIndexed ? new Date(folderData.lastIndexed) : null,
					createdAt: new Date(folderData.createdAt),
					updatedAt: new Date(folderData.updatedAt),
					// Asegurarnos de que _count existe
					_count: folderData._count || { images: folderData.imageCount || 0 },
				} as Folder;
			});

			setFolders(transformedData);
			viewLogger.info(`✅ ${data.length} carpetas cargadas`);

			// Cargar presets para carpetas que tengan presetId
			const presets: Record<string, CardOptions> = {};
			const presetsToLoad = transformedData.filter(folder => folder.presetId);

			if (presetsToLoad.length > 0) {
				viewLogger.info(`🔄 Cargando ${presetsToLoad.length} presets para carpetas...`);

				// Cargar presets en paralelo
				const presetPromises = presetsToLoad.map(async (folder) => {
					if (folder.presetId) {
						const presetOptions = await loadPresetConfig(folder.presetId);
						if (presetOptions) {
							presets[folder.id] = presetOptions;
						}
					}
				});

				await Promise.all(presetPromises);
				viewLogger.info(`✅ ${Object.keys(presets).length} presets cargados`);
			}

			setFolderPresets(presets);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando carpetas:', error);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [loadPresetConfig]);

	useEffect(() => {
		loadFolders();
	}, [loadFolders]);

	useEffect(() => {
		const loadVisualConfig = async () => {
			try {
				const response = await fetch('/api/entities/folders/visual-config');
				if (!response.ok) {
					throw new Error('Error al cargar la configuración visual');
				}
				const config = await response.json();
				// Combinamos la configuración del servidor con nuestros valores por defecto
				setVisualConfig({ ...DEFAULT_FOLDER_OPTIONS, ...config });
			} catch (error) {
				console.error('Error al cargar la configuración visual:', error);
				// Si hay un error, mantenemos la configuración predeterminada
			}
		};

		loadVisualConfig();
	}, []);

	// Función para obtener opciones de tarjeta para una carpeta específica
	const getFolderCardOptions = useCallback((folderId: string): CardOptions => {
		// Si la carpeta tiene un preset personalizado, usarlo
		if (folderPresets[folderId]) {
			return folderPresets[folderId];
		}
		// Si no, usar la configuración por defecto
		return visualConfig;
	}, [folderPresets, visualConfig]);

	const handleFolderClick = useCallback(
		async (folder: Folder) => {
			try {
				viewLogger.info('🖱️ Click en carpeta:', folder.name);

				// Verificaciones de seguridad
				if (!folder || !folder.id) {
					viewLogger.error('❌ Carpeta inválida:', folder);
					return;
				}

				// Limpiar selecciones previas
				clearSelection();

				// Asegurarnos de establecer la información completa de la carpeta en ambos stores

				// 1. Actualizar el store de navegación
				useNavigationStore.setState({
					currentView: 'folder-content',
					currentItem: {
						id: folder.id,
						name: folder.name,
						path: folder.path || '',
						description: folder.description || '',
						emoji: folder.emoji || '',
						_count: folder._count || { images: folder.imageCount || 0 },
						totalSize: folder.totalSize,
						lastIndexed: folder.lastIndexed,
						createdAt: folder.createdAt,
						itemType: 'folder',
					},
					navigationDirection: 1, // Indicar navegación hacia adelante
				});

				// 2. Actualizar el store de gestor de archivos
				useFileManager.setState({
					currentFolder: {
						id: folder.id,
						name: folder.name,
						path: folder.path || '',
						description: folder.description || '',
						emoji: folder.emoji || '',
						_count: folder._count || { images: folder.imageCount || 0 },
						totalSize: folder.totalSize,
						lastIndexed: folder.lastIndexed,
						createdAt: folder.createdAt,
						updatedAt: folder.updatedAt,
					},
					currentFolderId: folder.id,
					currentView: 'folder-content',
					isLoading: true, // Indicar que comenzará la carga
					selectedItems: [], // Limpiar selección explícitamente
					currentItems: [], // Limpiar items actuales para evitar datos antiguos
				});

				// 3. Ahora cambiar la vista
				setCurrentView('folder-content');

				viewLogger.info(`✅ Navegando a carpeta: ${folder.name} (${folder.id})`);
			} catch (error) {
				viewLogger.error('❌ Error al cambiar a la carpeta:', error);
			}
		},
		[setCurrentView, clearSelection]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
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
				{/* Título estilo TCG */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 text-transparent bg-clip-text drop-shadow-md">
						Colección de Carpetas
					</h1>
					<p className="text-muted-foreground mt-2">Explora tu colección de carpetas y descubre tus imágenes</p>
				</div>

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
									type: "spring",
									stiffness: 100,
									damping: 12
								}}
								className="cursor-pointer perspective-1000"
								onClick={onFolderClick}
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-folder-id={folder.id}
								>
									<EntityCardAdapter
										entityType="folder"
										entity={folder}
										onClick={onFolderClick}
										showVisualConfig={true}
										enableExplode={true}
										options={getFolderCardOptions(folder.id)}
									/>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}
