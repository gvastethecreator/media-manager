'use client';

import { Avatar, Badge, EmptyState } from '@/components/core/data-display';
import DetailsViewTitleBar from '@/components/core/navigation/details-view-title-bar';
import { getCardOptionsFromPreset } from '@/components/features/entity-cards/actions/visual-presets.actions';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { EntityDetailsPresetSection } from '@/components/features/entity-cards/ui/entity-details-preset-section';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from '@/lib/utils/date-utils';
import { useImageGalleryStore } from '@/store/image-gallery.store';
import type { AlbumWithDetails } from '@/types/entities/albums';
import { ImagePlusIcon, MessageCircleIcon, SettingsIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AlbumImageUploader } from '../editors/album-image-uploader';
import { AlbumSettings } from '../settings/album-settings';
import { AlbumCommentsTab } from '../tabs/album-comments-tab';
import { AlbumImagesTab } from '../tabs/album-images-tab';

// Opciones predeterminadas para la tarjeta de álbum
const DEFAULT_ALBUM_OPTIONS: CardOptions = {
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
		preset: 'album',
		variant: 'tcg',
		aspectRatio: '1/1', // Álbumes con aspecto cuadrado
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

	// Configuración de grid de imágenes
	useImageGrid: true,
	imageGridLayout: 'grid',
	imageGridGap: 2,
	imageGridStyle: 'polaroid',
};

interface AlbumDetailsViewProps {
	album: AlbumWithDetails;
}

export function AlbumDetailsView({ album }: AlbumDetailsViewProps) {
	const { toast } = useToast();
	const { openImageGallery } = useImageGalleryStore();
	const [isEditingImages, setIsEditingImages] = useState(false);
	const [activeTab, setActiveTab] = useState('images');
	const [albumCardOptions, setAlbumCardOptions] = useState<CardOptions>(DEFAULT_ALBUM_OPTIONS);

	// Estado para manejar la carga de presets
	const [isLoadingPreset, setIsLoadingPreset] = useState(!!album.presetId);

	// Cargar el preset visual del álbum si existe
	useEffect(() => {
		const loadAlbumPreset = async () => {
			if (album.presetId) {
				setIsLoadingPreset(true);
				try {
					const response = await getCardOptionsFromPreset(album.presetId, 'album');
					if (response.success && response.data) {
						setAlbumCardOptions(response.data as CardOptions);
					}
				} catch (error) {
					console.error('Error al cargar preset del álbum:', error);
				} finally {
					setIsLoadingPreset(false);
				}
			}
		};

		loadAlbumPreset();
	}, [album.presetId]);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
	};

	const openGallery = useCallback(
		(imageId: string) => {
			if (album.images && album.images.length > 0) {
				const imageIds = album.images.map((image) => image.id);
				openImageGallery(imageIds, imageId);
			}
		},
		[album.images, openImageGallery]
	);

	const handleEditImagesToggle = () => {
		setIsEditingImages(!isEditingImages);
	};

	// Manejar el cambio de preset
	const handlePresetChange = useCallback((presetId: string | null, options: CardOptions) => {
		setAlbumCardOptions(options);
	}, []);

	if (!album) {
		return (
			<EmptyState
				icon={ImagePlusIcon}
				title="Álbum no encontrado"
				description="El álbum que estás buscando no existe o ha sido eliminado."
			/>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<DetailsViewTitleBar title={album.name} subtitle="Detalles del álbum" backHref="/albums" />

			<div className="flex-1 overflow-hidden">
				<Tabs defaultValue="images" value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
					<div className="border-b px-4">
						<TabsList className="mb-4">
							<TabsTrigger value="images" className="data-[state=active]:bg-muted">
								Imágenes
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
							{isEditingImages ? (
								<AlbumImageUploader album={album} onFinish={handleEditImagesToggle} />
							) : (
								<AlbumImagesTab album={album} onImageClick={openGallery} onEditImages={handleEditImagesToggle} />
							)}
						</TabsContent>

						<TabsContent value="comments" className="h-full m-0 overflow-hidden">
							<AlbumCommentsTab album={album} />
						</TabsContent>

						<TabsContent value="settings" className="m-0 h-full overflow-y-hidden">
							<ScrollArea className="h-full">
								<div className="p-6 space-y-8 max-w-3xl mx-auto">
									{/* Información principal del álbum */}
									<div className="flex flex-col md:flex-row gap-8 items-start">
										{/* Tarjeta visual del álbum */}
										<div className="w-full md:w-1/3 mx-auto md:mx-0 max-w-[300px]">
											<EntityCardAdapter
												entityType="album"
												entity={album}
												showVisualConfig={false}
												enableExplode={true}
												options={albumCardOptions}
											/>
										</div>

										{/* Detalles del álbum */}
										<div className="flex-1 space-y-4">
											<div>
												<h2 className="text-2xl font-bold">{album.name}</h2>
												{album.description && <p className="text-muted-foreground mt-2">{album.description}</p>}
											</div>

											<div className="flex flex-wrap gap-2">
												{album.categories?.map((category) => (
													<Badge key={category.id} variant="outline">
														{category.name}
													</Badge>
												))}
											</div>

											<div className="text-sm text-muted-foreground">
												<p>Creado: {formatDistanceToNow(album.createdAt)}</p>
												<p>Última actualización: {formatDistanceToNow(album.updatedAt)}</p>
												<p>Total de imágenes: {album._count?.images || 0}</p>
											</div>

											{album.creator && (
												<div className="flex items-center gap-2 mt-4">
													<Avatar
														alt={album.creator.name || 'Usuario'}
														src={album.creator.image || ''}
														fallback={album.creator.name?.[0] || 'U'}
													/>
													<span className="text-sm">Creado por {album.creator.name}</span>
												</div>
											)}
										</div>
									</div>

									{/* Sección de configuración principal */}
									<AlbumSettings album={album} />

									{/* Sección de presets visuales */}
									<EntityDetailsPresetSection
										entityId={album.id}
										entityType="album"
										displayName="Álbum"
										currentPresetId={album.presetId}
										defaultOptions={DEFAULT_ALBUM_OPTIONS}
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