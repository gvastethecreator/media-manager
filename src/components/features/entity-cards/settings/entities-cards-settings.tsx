import {
	getEntityCardConfig,
	saveEntityCardConfig,
} from '@/components/features/entity-cards/modules/core/actions/entities-cards.actions';

import type { EntityType } from '@/components/features/entity-cards/adapters/preset-adapter';
import { adaptBaseToSettingsOptions } from '@/components/features/entity-cards/base/card-adapter';
import { DEFAULT_SETTINGS_OPTIONS } from '@/components/features/entity-cards/config/card-config-defaults';
import {
	adaptCardOptionsToLayersConfig,
	adaptEntityCardToLayerSystem,
	adaptLayerSystemToEntityCard,
	LayerPluginProvider,
	LayersPanel,
	LayersProvider,
	RegisterAllLayers
} from '@/components/features/entity-cards/layers';
import { DesignPanel } from '@/components/features/entity-cards/modules/design';
import { LayerManagementDialog } from '@/components/features/entity-cards/modules/layers-module/layer-management-dialog';
import { PreviewSettings } from '@/components/features/entity-cards/modules/preview/preview-settings-adapter';
import { PresetsPanel } from '@/components/features/entity-cards/settings/panels/presets-panel';
import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/types/base-card-types';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import type {
	CardConfigurationDto,
	ImageGridLayout,
	ImageGridStyle,
} from '@/components/features/entity-cards/types/card-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
	AlertCircle,
	ChevronRight,
	Eye,
	EyeOff,
	FolderIcon as FolderIconIcon,
	Grid2X2,
	ImageIcon,
	Images,
	Laptop,
	LayersIcon,
	LayoutGrid,
	LibrarySquare,
	Lightbulb,
	MapPin,
	Maximize2,
	MessageSquare,
	Minimize2,
	MousePointer,
	Package,
	PaintBucket,
	Palette,
	Repeat,
	Save,
	Settings,
	Settings2,
	Sliders,
	Sparkles,
	StickyNote,
	TagIcon,
	Users,
	VideoIcon,
	ZoomIn,
	ZoomOut,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

// Añadir la variable entityId que falta
const entityId = 'default'; // ID por defecto para componentes que no están asociados a una entidad específica

// Función para adaptar opciones entre diferentes estructuras de tipo
const adaptOptions = (options: Record<string, unknown>): CardOptions => {
	// Convertir imageStyle de objeto a string si es necesario
	const adaptedOptions = { ...options } as Record<string, unknown>;
	if (adaptedOptions.imageStyle && typeof adaptedOptions.imageStyle === 'object') {
		adaptedOptions.imageStyle = 'cover'; // Valor predeterminado compatible
	}

	// Asegurarnos de que effects tenga la estructura completa
	if (!adaptedOptions.effects) {
		adaptedOptions.effects = DEFAULT_SETTINGS_OPTIONS.effects;
	} else {
		// Asegurar que cada subefecto esté inicializado
		const effects = adaptedOptions.effects as Record<string, unknown>;
		if (!effects.glitchEffect) {
			effects.glitchEffect = DEFAULT_SETTINGS_OPTIONS.effects.glitchEffect;
		}
		if (!effects.chromaticAberration) {
			effects.chromaticAberration = DEFAULT_SETTINGS_OPTIONS.effects.chromaticAberration;
		}
		if (!effects.pixelate) {
			effects.pixelate = DEFAULT_SETTINGS_OPTIONS.effects.pixelate;
		}
	}

	// Asegurarnos de que layerSystem tenga la estructura completa
	if (!adaptedOptions.layerSystem) {
		adaptedOptions.layerSystem = {
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			layerBlending: 'screen',
			layerSpacing: 2,
		};
	}

	// Asegurarnos de que designSystem tenga la estructura completa
	if (!adaptedOptions.designSystem) {
		adaptedOptions.designSystem = DEFAULT_SETTINGS_OPTIONS.designSystem;
	}

	// Usamos unknown como intermediario para evitar errores de tipo
	return adaptBaseToSettingsOptions(adaptedOptions as Record<string, unknown>);
};

// Interfaz para opciones predeterminadas de cada tipo de entidad
interface EntityTypeOptions {
	entityType: string;
	options: CardOptions;
	title: string;
	description: string;
	icon: ReactNode;
	color: string; // Añadimos color para los iconos
	defaultRarity?: RarityConfig;
	defaultTexture?: TextureConfig;
}

// Lista de tipos de entidades disponibles con colores para los iconos
const entityTypes: EntityTypeOptions[] = [
	{
		entityType: 'card-folder',
		title: 'Carpetas',
		description: 'Configuración de tarjetas para carpetas',
		icon: <FolderIconIcon className="h-4 w-4" />,
		color: '#3b82f6', // Color azul
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			enable3DEffect: true,
			enableHolographicEffect: true,
			enableScanlines: false,
			enableLightHalo: true,
			enableAnimatedBorder: true,
			enableGlowEffect: true,
			enableGrainEffect: false,
			designSystem: {
				preset: 'folder',
				variant: 'default',
				aspectRatio: '7/10',
				cornerStyle: 'rounded',
				cornerRadius: 12,
				elevation: 2,
				shadowStyle: 'soft',
			},
			layerSystem: {
				order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
				layerBlending: 'screen',
				layerSpacing: 2,
			},
		}),
	},
	{
		entityType: 'card-album',
		title: 'Álbumes',
		description: 'Configuración de tarjetas para álbumes',
		icon: <Images className="h-4 w-4" />,
		color: '#8b5cf6', // Color morado
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-collection',
		title: 'Colecciones',
		description: 'Configuración de tarjetas para colecciones',
		icon: <LibrarySquare className="h-4 w-4" />,
		color: '#ef4444', // Color rojo
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-tag',
		title: 'Etiquetas',
		description: 'Configuración de tarjetas para etiquetas',
		icon: <TagIcon className="h-4 w-4" />,
		color: '#f59e0b', // Color naranja
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-character',
		title: 'Personas',
		description: 'Configuración de tarjetas para personas',
		icon: <Users className="h-4 w-4" />,
		color: '#ec4899', // Color rosa
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-world-item',
		title: 'Objetos',
		description: 'Configuración de tarjetas para objetos',
		icon: <Package className="h-4 w-4" />,
		color: '#f59e0b', // Color ámbar
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-place',
		title: 'Lugares',
		description: 'Configuración de tarjetas para lugares',
		icon: <MapPin className="h-4 w-4" />,
		color: '#14b8a6', // Color teal
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-concept',
		title: 'Conceptos',
		description: 'Configuración de tarjetas para conceptos',
		icon: <Lightbulb className="h-4 w-4" />,
		color: '#3b82f6', // Color azul
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-prompt',
		title: 'Prompts',
		description: 'Configuración de tarjetas para prompts',
		icon: <MessageSquare className="h-4 w-4" />,
		color: '#10b981', // Color verde
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-note',
		title: 'Notas',
		description: 'Configuración de tarjetas para notas',
		icon: <StickyNote className="h-4 w-4" />,
		color: '#a855f7', // Color púrpura
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'card-image',
		title: 'Imágenes',
		description: 'Configuración de imágenes',
		icon: <ImageIcon className="h-4 w-4" />,
		color: 'text-green-500',
		options: {} as CardOptions,
	},
	{
		entityType: 'card-video',
		title: 'Videos',
		description: 'Configuración de videos',
		icon: <VideoIcon className="h-4 w-4" />,
		color: 'text-purple-500',
		options: {} as CardOptions,
	},
];

// Función para convertir entre ID con prefijo y sin prefijo
const convertEntityId = {
	// Convertir de ID con prefijo 'card-' a ID sin prefijo para API
	toApiFormat: (entityId: string): string => entityId.replace('card-', ''),

	// Convertir de ID sin prefijo a ID con prefijo 'card-' para la UI
	toUiFormat: (entityId: string): string => (entityId.startsWith('card-') ? entityId : `card-${entityId}`),
};

// Definición de categorías con sus colores y estilos
const categories = [
	{
		id: 'basic',
		title: 'Configuración Básica',
		icon: Settings2,
		color: '#3b82f6',
		panels: [
			{
				id: 'presets',
				title: 'Presets y Plantillas',
				icon: LayoutGrid,
				color: '#3b82f6',
			},
			{
				id: 'preview',
				title: 'Vista Previa',
				icon: ZoomIn,
				color: '#10b981',
			},
			{
				id: 'folders',
				title: 'Configuración de Carpetas',
				icon: FolderIconIcon,
				color: '#3b82f6',
			},
			{
				id: 'systems',
				title: 'Sistemas y Atributos',
				icon: PaintBucket,
				color: '#8b5cf6',
			},
		],
	},
	{
		id: 'appearance',
		title: 'Apariencia',
		icon: Palette,
		color: '#10b981',
		panels: [
			{
				id: 'design',
				title: 'Diseño y Colores',
				icon: Palette,
				color: '#10b981',
			},
			{
				id: 'layers',
				title: 'Sistema de Capas',
				icon: LayersIcon,
				color: '#8b5cf6',
			},
			{
				id: 'visual',
				title: 'Efectos Visuales',
				icon: Sparkles,
				color: '#f59e0b',
			},
			{
				id: 'distortion',
				title: 'Efectos de Distorsión',
				icon: Sliders,
				color: '#ef4444',
			},
			{
				id: 'advanced',
				title: 'Efectos Avanzados',
				icon: Settings2,
				color: '#8b5cf6',
			},
			{
				id: 'filters',
				title: 'Filtros',
				icon: Sliders,
				color: '#14b8a6',
			},
			{
				id: 'patterns',
				title: 'Patrones',
				icon: Grid2X2,
				color: '#ec4899',
			},
			{
				id: 'shaders',
				title: 'Shaders',
				icon: Sparkles,
				color: '#f59e0b',
			},
			{
				id: 'backside',
				title: 'Cara Posterior',
				icon: Repeat,
				color: '#ec4899',
			},
		],
	},
	{
		id: 'content',
		title: 'Contenido',
		icon: Grid2X2,
		color: '#ec4899',
		panels: [
			{
				id: 'images',
				title: 'Imágenes y Multimedia',
				icon: Grid2X2,
				color: '#ec4899',
			},
			{
				id: 'states',
				title: 'Estados Interactivos',
				icon: Repeat,
				color: '#f59e0b',
			},
			{
				id: 'interaction',
				title: 'Interacción',
				icon: MousePointer,
				color: '#10b981',
			},
		],
	},
	{
		id: 'technical',
		title: 'Técnico',
		icon: Laptop,
		color: '#14b8a6',
		panels: [
			{
				id: 'performance',
				title: 'Rendimiento y Optimización',
				icon: Laptop,
				color: '#14b8a6',
			},
			{
				id: 'core',
				title: 'Configuración del Core',
				icon: Settings,
				color: '#8b5cf6',
			},
		],
	},
];

// Componente para selección de tipo de entidad con Popover
const EntityTypeSelector = ({
	activeEntityType,
	onEntityTypeChange,
}: {
	activeEntityType: string;
	onEntityTypeChange: (type: string) => void;
}) => {
	const activeEntity = entityTypes.find((e) => e.entityType === activeEntityType);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="w-full justify-between text-[11px] font-normal">
					<div className="flex items-center gap-2">
						<span className="flex items-center justify-center" style={{ color: activeEntity?.color }}>
							{activeEntity?.icon}
						</span>
						{activeEntity?.title || 'Seleccionar tipo'}
					</div>
					<ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<div className="grid gap-1 p-1">
					{entityTypes.map((entityType) => (
						<Button
							key={entityType.entityType}
							variant={activeEntityType === entityType.entityType ? 'secondary' : 'ghost'}
							className="w-full justify-start gap-2 text-[11px] font-normal"
							onClick={() => onEntityTypeChange(entityType.entityType)}
						>
							<span className="flex items-center justify-center" style={{ color: entityType.color }}>
								{entityType.icon}
							</span>
							{entityType.title}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
};

// Componente para la navegación
const NavigationPanel = ({
	activeEntityType,
	onEntityTypeChange,
	activeCategory,
	onCategoryChange,
	activePanel,
	onPanelChange,
}: {
	activeEntityType: string;
	onEntityTypeChange: (type: string) => void;
	activeCategory: string;
	onCategoryChange: (category: string) => void;
	activePanel: string;
	onPanelChange: (panel: string) => void;
}) => {
	const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

	const handleCollapseToggle = (categoryId: string) => {
		setCollapsedCategories((prev) => ({
			...prev,
			[categoryId]: !prev[categoryId],
		}));
	};

	return (
		<div className="flex flex-col h-full">
			<ScrollArea className="flex-1">
				<div className="p-1 space-y-2">
					{/* Selector de Tipo de Entidad */}
					<EntityTypeSelector activeEntityType={activeEntityType} onEntityTypeChange={onEntityTypeChange} />

					{/* Categorías y Paneles */}
					<div className="space-y-0.5">
						{categories.map((category) => (
							<div key={category.id} className="space-y-0.5 cursor-pointer">
								<button
									onClick={() => handleCollapseToggle(category.id)}
									className={cn(
										'flex items-center w-full gap-1.5 px-2 py-1.5 text-[11px] font-medium rounded-md',
										'hover:bg-secondary/20 transition-all duration-150',
										activeCategory === category.id ? 'bg-secondary/30 text-primary' : 'text-muted-foreground'
									)}
									type="button"
								>
									<span className="flex items-center justify-center" style={{ color: category.color }}>
										<category.icon className="h-3.5 w-3.5" />
									</span>
									{category.title}
									<ChevronRight
										className={cn(
											'h-3.5 w-3.5 ml-auto transition-transform',
											collapsedCategories[category.id] ? 'rotate-90' : ''
										)}
									/>
								</button>

								{!collapsedCategories[category.id] && (
									<div className="pl-4 space-y-0.5">
										{category.panels.map((panel) => (
											<button
												key={panel.id}
												onClick={() => {
													onCategoryChange(category.id);
													onPanelChange(panel.id);
												}}
												className={cn(
													'flex items-center w-full gap-1.5 px-2 py-1.5 text-[10px] font-medium rounded-md',
													'hover:bg-secondary/20 transition-all duration-150',
													activePanel === panel.id ? 'bg-secondary/30 text-primary' : 'text-muted-foreground'
												)}
												type="button"
											>
												<span className="flex items-center justify-center" style={{ color: panel.color }}>
													<panel.icon className="h-3.5 w-3.5" />
												</span>
												{panel.title}
											</button>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
};

// Función local para guardar configuraciones generales
async function saveGeneralSettings(
	entityType: string,
	settings: CardConfigurationDto
): Promise<{ success: boolean; message: string }> {
	try {
		// Utilizamos la función existente saveEntityCardConfig para guardar la configuración
		const result = await saveEntityCardConfig(entityType, settings);
		return {
			success: result.success,
			message: result.message,
		};
	} catch (error) {
		console.error('Error al guardar configuración general:', error);
		return {
			success: false,
			message: 'Error al guardar la configuración general',
		};
	}
}

// Tipos de paneles disponibles
type PanelType = 'presets' | 'design' | 'effects' | 'layers' | 'system' | 'preview' | 'performance';

export function EntitiesCardsSection() {
	const { toast } = useToast();

	// Estado para el tipo de entidad activo
	const [activeEntityType, setActiveEntityType] = useState<string>('card-album');

	// Estado para las opciones de la tarjeta activa
	const [cardOptions, setCardOptions] = useState<CardOptions>(
		adaptOptions(DEFAULT_SETTINGS_OPTIONS as unknown as Record<string, unknown>)
	);

	// Estados para rareza y textura seleccionadas para vista previa
	const [selectedRarity, setSelectedRarity] = useState<RarityConfig | null>(null);
	const [selectedTexture, setSelectedTexture] = useState<TextureConfig | null>(null);

	// Estado para el preset activo
	const [activePreset, setActivePreset] = useState<string | null>(null);

	// Estado para indicar si está guardando
	const [isSaving, setIsSaving] = useState(false);

	// Estado para errores
	const [error, setError] = useState<string | null>(null);

	// Estado para la categoría activa
	const [activeCategory, setActiveCategory] = useState<string>('basic');
	const [activePanel, setActivePanel] = useState<PanelType>('design');

	// Estado para mostrar información y controles en la vista previa
	const [showInfo, setShowInfo] = useState(true);
	const [showControls, setShowControls] = useState(true);

	// Estado para el zoom de la vista previa
	const [previewZoom, setPreviewZoom] = useState(1);

	// Estado para el modo de vista previa expandida
	const [isExpandedPreview, setIsExpandedPreview] = useState(false);

	// Estado para la capa activa en la vista previa
	const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
	const [isExploded, setIsExploded] = useState(false);

	// Cargar opciones al cambiar el tipo de entidad
	const loadEntityOptions = useCallback(async () => {
		try {
			setError(null);
			if (!activeEntityType) {
				return;
			}

			// Eliminar el prefijo 'card-' para las llamadas a la API
			const apiEntityType = convertEntityId.toApiFormat(activeEntityType);
			const response = await getEntityCardConfig(apiEntityType);

			if (response.success && response.data) {
				// Convertir las opciones del servidor al formato de la interfaz de usuario
				const serverOptions = response.data as Record<string, unknown>;
				const uiOptions: CardOptions = adaptOptions({
					...serverOptions,
					raritySystem: !!serverOptions.raritySystem,
					textureSystem: !!serverOptions.textureSystem,
					categorySystem: !!serverOptions.categorySystem,
					// Asegurar que las opciones de preview estén inicializadas
					preview: {
						size: 'medium',
						showControls: true,
						showInfo: true,
						showBorder: true,
						enableInteraction: true,
						...(serverOptions.preview || {}),
					},
				});
				setCardOptions(uiOptions);

				// Si la entidad tiene un preset activo, actualizar el estado
				const entityData = response.data as Record<string, unknown>;
				if (entityData.presetId) {
					setActivePreset(entityData.presetId as string);
				} else {
					setActivePreset(null);
				}
			} else {
				// Si no hay opciones guardadas, usar las predeterminadas del tipo de entidad
				const defaultOptions =
					entityTypes.find((e) => e.entityType === activeEntityType)?.options ||
					adaptOptions(DEFAULT_SETTINGS_OPTIONS as unknown as Record<string, unknown>);
				setCardOptions(defaultOptions);
				setActivePreset(null);
			}
		} catch (error) {
			console.error('Error al cargar opciones de tarjeta:', error);
			setError('No se pudieron cargar las opciones de tarjeta');
			toast({
				title: 'Error',
				description: 'No se pudo cargar la configuración de tarjetas',
				variant: 'destructive',
			});
		}
	}, [activeEntityType, toast]);

	// Cargar opciones al iniciar o cambiar el tipo de entidad
	useEffect(() => {
		loadEntityOptions();
	}, [loadEntityOptions]);

	// Guardar opciones de tarjeta
	const handleSaveOptions = async () => {
		try {
			setIsSaving(true);
			setError(null);

			if (!activeEntityType) {
				toast({
					title: 'Error',
					description: 'No se ha seleccionado un tipo de entidad',
					variant: 'destructive',
				});
				return;
			}

			// Eliminar el prefijo 'card-' para las llamadas a la API
			const apiEntityType = convertEntityId.toApiFormat(activeEntityType);

			// Extraemos solo las propiedades que necesitamos enviar al servidor
			const serverOptionsDto: CardConfigurationDto = {
				entityType: apiEntityType,
				enable3DEffect: !!cardOptions.enable3DEffect,
				enableHolographicEffect: !!cardOptions.enableHolographicEffect,
				enableScanlines: !!cardOptions.enableScanlines,
				enableLightHalo: !!cardOptions.enableLightHalo,
				enableAnimatedBorder: !!cardOptions.enableAnimatedBorder,
				enableGlowEffect: !!cardOptions.enableGlowEffect,
				enableGrainEffect: !!cardOptions.enableGrainEffect,
				hoverLiftHeight: cardOptions.hoverLiftHeight || 10,
				maxRotation: cardOptions.maxRotation || 15,
				primaryColor: cardOptions.primaryColor || '0, 153, 255',
				secondaryColor: cardOptions.secondaryColor || '128, 0, 255',
				raritySystem: !!cardOptions.raritySystem,
				categorySystem: !!cardOptions.categorySystem,
				textureSystem: !!cardOptions.textureSystem,
				// Grid de imágenes
				imageGridLayout: cardOptions.imageGridLayout as ImageGridLayout,
				imageGridGap: cardOptions.imageGridGap,
				imageGridStyle: cardOptions.imageGridStyle as ImageGridStyle,
				showImageCount: !!cardOptions.showImageCount,
				imageGridAspectRatio: cardOptions.imageGridAspectRatio,
				// Convertir objetos a JSON para almacenamiento
				holographicOptions: cardOptions.holographicOptions ? JSON.stringify(cardOptions.holographicOptions) : undefined,
				scanlinesOptions: cardOptions.scanlinesOptions ? JSON.stringify(cardOptions.scanlinesOptions) : undefined,
				glowOptions: cardOptions.glowOptions ? JSON.stringify(cardOptions.glowOptions) : undefined,
				borderOptions: cardOptions.borderOptions ? JSON.stringify(cardOptions.borderOptions) : undefined,
				grainOptions: cardOptions.grainOptions ? JSON.stringify(cardOptions.grainOptions) : undefined,
				// No incluir presetId ya que no es parte de CardConfigurationDto
			};

			// Guardar la configuración en el servidor
			const response = await saveEntityCardConfig(apiEntityType, serverOptionsDto);

			if (response.success) {
				toast({
					title: 'Éxito',
					description: 'Configuración de tarjetas guardada correctamente',
				});
			} else {
				setError(response.message);
				toast({
					title: 'Error',
					description: response.message,
					variant: 'destructive',
				});
			}
		} catch (error) {
			console.error('Error al guardar opciones:', error);
			setError('No se pudieron guardar las opciones');
			toast({
				title: 'Error',
				description: 'No se pudo guardar la configuración de tarjetas',
				variant: 'destructive',
			});
		} finally {
			setIsSaving(false);
		}
	};

	// Manejar cambios en opciones de tarjeta
	const handleCardOptionsChange = (newOptions: CardOptions) => {
		// Asegurarse de que las propiedades de preview se mantengan
		const updatedOptions = {
			...newOptions,
			preview: {
				...(cardOptions.preview || {}),
				...(newOptions.preview || {}),
			},
		};

		setCardOptions(updatedOptions);
		// Solo limpiamos el preset activo si se cambia alguna configuración
		if (activePreset) {
			setActivePreset(null);
		}
	};

	// Manejador para cuando se selecciona un preset
	const handlePresetSelect = async (preset: { id: string; name: string; options: CardOptions }) => {
		// Actualizar las opciones de tarjeta con las del preset
		setCardOptions(preset.options);
		setActivePreset(preset.id);

		// Notificar al usuario
		toast({
			title: 'Éxito',
			description: `Preset "${preset.name}" aplicado correctamente`,
		});

		// Aunque optamos por actualizar inmediatamente las opciones visuales,
		// la asociación entre entidad y preset se guardará cuando el usuario guarde los cambios
	};

	// Encontrar la entidad activa
	const activeEntity = entityTypes.find((e) => e.entityType === activeEntityType);

	if (error) {
		return (
			<Card className="bg-muted/30 rounded-sm">
				<div className="p-4 flex flex-col gap-2">
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-5 w-5" />
						<p className="text-sm">{error}</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setError(null);
							loadEntityOptions();
						}}
						className="mt-2 w-full text-xs"
					>
						Reintentar
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<Card className="bg-muted/30 rounded-sm border-none">
			<CardContent className="p-3">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-1">
					{/* COLUMNA 1: Navegación - Lado izquierdo (2 columnas) */}
					<div className="md:col-span-2">
						<NavigationPanel
							activeEntityType={activeEntityType}
							onEntityTypeChange={setActiveEntityType}
							activeCategory={activeCategory}
							onCategoryChange={setActiveCategory}
							activePanel={activePanel}
							onPanelChange={setActivePanel}
						/>
					</div>

					{/* COLUMNA 2: Vista previa - Columna central (5 columnas) */}
					<div className="md:col-span-6 flex flex-col">
						{activeEntity && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
								key={`preview-${activeEntityType}`}
								className="flex flex-col items-center"
							>
								{/* Registrar todas las capas disponibles */}
								<LayerPluginProvider>
									<RegisterAllLayers />
								</LayerPluginProvider>

								<div className="relative flex-1 flex items-center justify-center w-full">
									{/* Controles de vista previa */}
									<div className="absolute top-2 right-2 flex gap-2 z-10">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
														onClick={() => setShowInfo(!showInfo)}
													>
														{showInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
													</Button>
												</TooltipTrigger>
												<TooltipContent side="left" className="text-[10px]">
													{showInfo ? 'Ocultar información' : 'Mostrar información'}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
														onClick={() => setShowControls(!showControls)}
													>
														<Settings2 className="h-4 w-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent side="left" className="text-[10px]">
													{showControls ? 'Ocultar controles' : 'Mostrar controles'}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
														onClick={() => setPreviewZoom(Math.min(previewZoom + 0.1, 1.5))}
													>
														<ZoomIn className="h-4 w-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent side="left" className="text-[10px]">
													Aumentar zoom
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
														onClick={() => setPreviewZoom(Math.max(previewZoom - 0.1, 0.5))}
													>
														<ZoomOut className="h-4 w-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent side="left" className="text-[10px]">
													Reducir zoom
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
														onClick={() => setIsExpandedPreview(!isExpandedPreview)}
													>
														{isExpandedPreview ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
													</Button>
												</TooltipTrigger>
												<TooltipContent side="left" className="text-[10px]">
													{isExpandedPreview ? 'Vista normal' : 'Vista expandida'}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>

									{/* Panel de vista previa */}
									<div
										className={cn(
											'transition-all duration-300 ease-in-out',
											isExpandedPreview ? 'scale-110' : 'scale-100'
										)}
										style={{ transform: `scale(${previewZoom})` }}
									>
										<LayerPluginProvider>
											<RegisterAllLayers />
											<PreviewSettings
												cardOptions={cardOptions}
												rarity={selectedRarity}
												texture={selectedTexture}
												entityType={convertEntityId.toApiFormat(activeEntityType) as EntityType}
												activeLayerId={activeLayerId}
												isExploded={isExploded}
												onExplodedChange={setIsExploded}
												onActiveLayerChange={setActiveLayerId}
											/>
										</LayerPluginProvider>
									</div>

									{showControls && (
										<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
											<Button
												variant="outline"
												size="sm"
												className="text-[11px]"
												onClick={() => setSelectedRarity(null)}
											>
												Sin Rareza
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="text-[11px]"
												onClick={() => setSelectedTexture(null)}
											>
												Sin Textura
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="text-[11px]"
												onClick={() => {
													setPreviewZoom(1);
													setIsExpandedPreview(false);
												}}
											>
												Restablecer Vista
											</Button>
										</div>
									)}
								</div>

								<div className="mt-4 flex gap-2 justify-center">
									<Button
										onClick={handleSaveOptions}
										disabled={isSaving}
										className="w-fit self-center text-[11px]"
										size="lg"
									>
										<Save className={cn('h-4 w-4 mr-2', isSaving && 'animate-spin')} />
										{isSaving ? 'Guardando cambios...' : 'Guardar configuración'}
									</Button>

									{/* Botón para gestionar capas */}
									<LayerManagementDialog
										entityType={convertEntityId.toApiFormat(activeEntityType)}
										config={adaptEntityCardToLayerSystem(cardOptions)}
										onChange={(layerConfig) => {
											// Convertir la configuración de capas a formato de tarjeta
											const newCardOptions = adaptLayerSystemToEntityCard(layerConfig);
											handleCardOptionsChange(newCardOptions);
										}}
										trigger={
											<Button variant="outline" size="lg" className="w-fit self-center text-[11px]">
												<LayersIcon className="h-4 w-4 mr-2" />
												Gestionar Capas
											</Button>
										}
									/>
								</div>
							</motion.div>
						)}
					</div>

					{/* COLUMNA 3: Configuración - Lado derecho (5 columnas) */}
					<div className="md:col-span-4 border-l border-border pl-2">
						{activeEntity && (
							<ScrollArea className="h-[calc(100vh-160px)]">
								<div className="space-y-4">
									{/* Renderizar el panel activo basado en activePanel */}
									{activePanel === 'presets' && (
										<PresetsPanel
											activePreset={activePreset}
											onPresetSelect={handlePresetSelect}
											entityType={convertEntityId.toApiFormat(activeEntityType)}
											cardOptions={cardOptions}
										/>
									)}
									{activePanel === 'design' && (
										<DesignPanel
											designSystem={
												{} as import('@/components/features/entity-cards/modules/design/types').DesignSystem
											}
											onChange={handleCardOptionsChange}
										/>
									)}
									{/* Panel de vista previa */}
									{activePanel === 'preview' && (
										<PreviewSettings
											options={cardOptions}
											onChange={handleCardOptionsChange}
											disabled={false}
										/>
									)}
									{/* Panel de capas */}
									{activePanel === 'layers' && (
										<LayersProvider initialConfig={adaptCardOptionsToLayersConfig(cardOptions)}>
											<LayerPluginProvider>
												<RegisterAllLayers />
												<LayersPanel
													config={adaptEntityCardToLayerSystem(cardOptions)}
													onChange={(layerConfig) => {
														// Convertir la configuración de capas a formato de tarjeta
														const newCardOptions = adaptLayerSystemToEntityCard(layerConfig);
														handleCardOptionsChange(newCardOptions);
													}}
													cardOptions={cardOptions}
													onCardOptionsChange={handleCardOptionsChange}
												/>
											</LayerPluginProvider>
										</LayersProvider>
									)}
									{/* Comentar o modificar los componentes que no existen */}
									{/*
									{activePanel === 'systems' && (
										<SystemSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									*/}
									{/* Comentar o modificar los componentes que no existen */}
									{/*
									{activePanel === 'visual' && (
										<VisualEffectsSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'distortion' && (
										<DistortionEffectsSettings
											options={cardOptions}
											onChange={handleCardOptionsChange}
											disabled={false}
										/>
									)}
									{activePanel === 'advanced' && (
										<AdvancedSettingsPanel cardOptions={cardOptions} onChange={handleCardOptionsChange} />
									)}
									{activePanel === 'general' && (
										<GeneralSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'content' && (
										<ContentSettingsPanel cardOptions={cardOptions} onChange={handleCardOptionsChange} />
									)}
									{(activePanel === 'filters' || activePanel === 'patterns' || activePanel === 'shaders') && (
										<LayersSettingsPanel
											options={cardOptions}
											onChange={handleCardOptionsChange}
											entityType={convertEntityId.toApiFormat(activeEntityType)}
											entityId={entityId}
											disabled={false}
										/>
									)}
									{activePanel === 'images' && (
										<ImageGridSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'states' && (
										<StatesSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'interaction' && (
										<InteractionSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'performance' && (
										<PerformanceSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'folders' && (
										<FolderSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'shadows' && (
										<ShadowsSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'colorPalette' && (
										<ColorPaletteSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'rarity' && (
										<RaritySettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'layers' && (
										<LayersSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'backside' && (
										<BacksideSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'core' && (
										<CoreSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									*/}
								</div>
							</ScrollArea>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
