'use client';

import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import DetailsViewTitleBar from '@/components/core/navigation/details-view-title-bar';
import { getCardOptionsFromPreset } from '@/components/features/entity-cards/actions/visual-presets.actions';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { EntityDetailsPresetSection } from '@/components/features/entity-cards/ui/entity-details-preset-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow, formatLocalDateTime } from '@/lib/utils/date-utils';
import { formatBytes } from '@/lib/utils/format-utils';
import { useImageGalleryStore } from '@/store/image-gallery.store';
import type { Folder } from '@/types/entities/folders';
import { FileIcon, FolderIcon, ImageIcon, MessageCircleIcon, SettingsIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FolderStatsCard } from '../components/folder-stats-card';
import { FolderCommentsTab } from '../tabs/folder-comments-tab';
import { FolderFilesTab } from '../tabs/folder-files-tab';
import { FolderImagesTab } from '../tabs/folder-images-tab';
import { FolderSettingsTab } from '../tabs/folder-settings-tab';

// Opciones predeterminadas para la tarjeta de carpeta
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
		preset: 'folder',
		variant: 'tcg',
		aspectRatio: '7/10', // Proporción estándar de cartas coleccionables
		cornerStyle: 'rounded',
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

	// Configuración específica de carpetas
	showTotalFiles: true,
	showTotalSize: true,
	showLastIndexed: true,
};

interface FolderDetailsViewProps {
	folder: Folder;
}

export function FolderDetailsView({ folder }: FolderDetailsViewProps) {
	const { toast } = useToast();
	const { openImageGallery } = useImageGalleryStore();
	const [activeTab, setActiveTab] = useState('images');
	const [folderCardOptions, setFolderCardOptions] = useState<CardOptions>(DEFAULT_FOLDER_OPTIONS);

	// Estado para manejar la carga de presets
	const [isLoadingPreset, setIsLoadingPreset] = useState(!!folder.presetId);

	// Cargar el preset visual de la carpeta si existe
	useEffect(() => {
		const loadFolderPreset = async () => {
			if (folder.presetId) {
				setIsLoadingPreset(true);
				try {
					const response = await getCardOptionsFromPreset(folder.presetId, 'folder');
					if (response.success && response.data) {
						setFolderCardOptions(response.data as CardOptions);
					}
				} catch (error) {
					console.error('Error al cargar preset de la carpeta:', error);
				} finally {
					setIsLoadingPreset(false);
				}
			}
		};

		loadFolderPreset();
	}, [folder.presetId]);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
	};

	const openGallery = useCallback(
		(imageId: string) => {
			if (folder.images && folder.images.length > 0) {
				const imageIds = folder.images.map((image) => image.id);
				openImageGallery(imageIds, imageId);
			}
		},
		[folder.images, openImageGallery]
	);

	// Manejar el cambio de preset
	const handlePresetChange = useCallback((presetId: string | null, options: CardOptions) => {
		setFolderCardOptions(options);
	}, []);

	if (!folder) {
		return (
			<EmptyState
				icon={FolderIcon}
				title="Carpeta no encontrada"
				description="La carpeta que estás buscando no existe o ha sido eliminada."
			/>
		);
	}

	if (isLoadingPreset) {
		return <LoadingScreen message="Cargando configuración visual..." />;
	}

	return (
		<div className="h-full flex flex-col">
			<DetailsViewTitleBar title={folder.name} subtitle="Detalles de la carpeta" backHref="/folders" />

			<div className="flex-1 overflow-hidden">
				<Tabs defaultValue="images" value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
					<div className="border-b px-4">
						<TabsList className="mb-4">
							<TabsTrigger value="images" className="data-[state=active]:bg-muted">
								<ImageIcon className="mr-2 h-4 w-4" />
								Imágenes
							</TabsTrigger>
							<TabsTrigger value="files" className="data-[state=active]:bg-muted">
								<FileIcon className="mr-2 h-4 w-4" />
								Archivos
							</TabsTrigger>
							<TabsTrigger value="comments" className="data-[state=active]:bg-muted">
								<MessageCircleIcon className="mr-2 h-4 w-4" />
								Comentarios
							</TabsTrigger>
							<TabsTrigger value="settings" className="data-[state=active]:bg-muted">
								<SettingsIcon className="mr-2 h-4 w-4" />
								Configuración
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="flex-1 overflow-hidden">
						<TabsContent value="images" className="h-full m-0 overflow-hidden">
							<FolderImagesTab folder={folder} onImageClick={openGallery} />
						</TabsContent>

						<TabsContent value="files" className="h-full m-0 overflow-hidden">
							<FolderFilesTab folder={folder} />
						</TabsContent>

						<TabsContent value="comments" className="h-full m-0 overflow-hidden">
							<FolderCommentsTab folder={folder} />
						</TabsContent>

						<TabsContent value="settings" className="m-0 h-full overflow-y-hidden">
							<ScrollArea className="h-full">
								<div className="p-6 space-y-8 max-w-3xl mx-auto">
									{/* Información principal de la carpeta */}
									<div className="flex flex-col md:flex-row gap-8 items-start">
										{/* Tarjeta visual de la carpeta */}
										<div className="w-full md:w-1/3 mx-auto md:mx-0 max-w-[300px]">
											<EntityCardAdapter
												entityType="folder"
												entity={folder}
												showVisualConfig={false}
												enableExplode={true}
												options={folderCardOptions}
											/>
										</div>

										{/* Detalles de la carpeta */}
										<div className="flex-1 space-y-4">
											<div>
												<h2 className="text-2xl font-bold">
													{folder.emoji && <span className="mr-2">{folder.emoji}</span>}
													{folder.name}
												</h2>
												{folder.description && <p className="text-muted-foreground mt-2">{folder.description}</p>}
											</div>

											<div className="flex flex-wrap gap-2">
												{folder.path && (
													<Badge variant="outline" className="flex items-center gap-1">
														<FolderIcon className="h-3 w-3" />
														{folder.path}
													</Badge>
												)}
											</div>

											<div className="text-sm text-muted-foreground space-y-1">
												<p>Creado: {formatDistanceToNow(folder.createdAt)}</p>
												<p>Última actualización: {formatDistanceToNow(folder.updatedAt)}</p>
												{folder.lastIndexed && (
													<p>Última indexación: {formatLocalDateTime(folder.lastIndexed)}</p>
												)}
												<p>Total de imágenes: {folder._count?.images || 0}</p>
												{folder.totalSize !== undefined && (
													<p>Tamaño total: {formatBytes(folder.totalSize)}</p>
												)}
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
												<FolderStatsCard folder={folder} />
												<Button
													variant="outline"
													size="sm"
													className="mt-auto"
													onClick={() => toast({
														title: "Próximamente",
														description: "Esta funcionalidad estará disponible pronto"
													})}
												>
													Re-indexar carpeta
												</Button>
											</div>
										</div>
									</div>

									{/* Sección de configuración principal */}
									<FolderSettingsTab folder={folder} />

									{/* Sección de presets visuales */}
									<EntityDetailsPresetSection
										entityId={folder.id}
										entityType="folder"
										displayName="Carpeta"
										currentPresetId={folder.presetId}
										defaultOptions={DEFAULT_FOLDER_OPTIONS}
										onPresetApplied={handlePresetChange}
									/>
								</div>
							</ScrollArea>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	);
}