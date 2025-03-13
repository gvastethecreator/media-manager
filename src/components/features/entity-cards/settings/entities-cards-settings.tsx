'use client';

import type { RaritySystem } from '@/app/actions/entities-cards/entities-cards.actions';
import { getEntityCardConfig, saveEntityCardConfig } from '@/app/actions/entities-cards/entities-cards.actions';
import type { TextureSystem } from '@/components/features/entity-cards/types/base-card-types';

import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/types/base-card-types';
import type {
	CardConfigurationDto,
	ImageGridLayout,
	ImageGridStyle,
} from '@/components/features/entity-cards/types/card-types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert-enhanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toastService } from '@/lib/services/toast.service';
import { cn } from '@/lib/utils';
import {
	AlertCircle,
	ChevronRight,
	Eye,
	Grid2X2,
	Images,
	Info,
	Laptop,
	Layers,
	LayoutGrid,
	LibrarySquare,
	Lightbulb,
	MapPin,
	MessageSquare,
	MousePointer,
	Package,
	PaintBucket,
	Palette,
	RefreshCw,
	Repeat,
	Save,
	Settings,
	Settings2,
	Sliders,
	Sparkles,
	StickyNote,
	TagIcon,
	Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import type * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { adaptBaseToSettingsOptions } from '../base/card-adapter';
import { DEFAULT_SETTINGS_OPTIONS } from '../config/card-config-defaults';
import type { CardOptions } from '../types/card-settings-types';
import { FiltersSettings, PatternsSettings, ShadersSettings } from './panels';
import { AdvancedEffectsSettings } from './panels/advanced-effects-settings';
import { DesignSettings } from './panels/design-settings';
import { DistortionEffectsSettings } from './panels/distortion-effects-settings';
import { ImageGridSettings } from './panels/image-grid-settings';
import { InteractionSettings } from './panels/interaction-settings';
import { PerformanceSettings } from './panels/performance-settings';
import { PresetsPanel } from './panels/presets-panel';
import { PreviewSettings } from './panels/preview-settings';
import { StatesSettings } from './panels/states-settings';
import { SystemSettings } from './panels/system-settings';
import { VisualEffectsSettings } from './panels/visual-effects-settings';
import { EntityCardPreview } from './preview/entity-card-preview';
import { PreviewPanel } from './preview/preview-panel';

// Función para adaptar opciones entre diferentes estructuras de tipo
const adaptOptions = (options: Record<string, unknown>): CardOptions => {
	// Convertir imageStyle de objeto a string si es necesario
	const adaptedOptions = { ...options } as Record<string, unknown>;
	if (adaptedOptions.imageStyle && typeof adaptedOptions.imageStyle === 'object') {
		adaptedOptions.imageStyle = 'cover'; // Valor predeterminado compatible
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
			{
				id: 'preview',
				title: 'Vista Previa',
				icon: Eye,
				color: '#3b82f6',
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
		],
	},
];

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
		<div className="flex flex-col h-full bg-background">
			<ScrollArea className="flex-1">
				<div className="p-1 pr-3 space-y-0">
					{/* Tipos de Entidad */}
					<div className="space-y-1">
						{entityTypes.map((entityType) => (
							<button
								key={entityType.entityType}
								onClick={() => onEntityTypeChange(entityType.entityType)}
								className={cn(
									'flex items-center w-full gap-2 px-3 py-2 text-[11px] font-medium rounded-md',
									'hover:bg-secondary/20 transition-all duration-150',
									activeEntityType === entityType.entityType ? 'bg-secondary/30 text-primary' : 'text-muted-foreground'
								)}
								type="button"
							>
								<span className="flex items-center justify-center" style={{ color: entityType.color }}>
									{entityType.icon}
								</span>
								{entityType.title}
							</button>
						))}
					</div>

					<Separator className="my-2" />

					{/* Categorías y Paneles */}
					<div className="space-y-1">
						{categories.map((category) => (
							<div key={category.id}>
								<button
									onClick={() => handleCollapseToggle(category.id)}
									className={cn(
										'flex items-center w-full gap-2 px-3 py-2 text-[11px] font-medium rounded-md',
										'hover:bg-secondary/20 transition-all duration-150',
										activeCategory === category.id ? 'bg-secondary/30 text-primary' : 'text-muted-foreground'
									)}
									type="button"
								>
									<span className="flex items-center justify-center" style={{ color: category.color }}>
										<category.icon className="h-4 w-4" />
									</span>
									{category.title}
									<ChevronRight
										className={cn(
											'h-4 w-4 ml-auto transition-transform',
											collapsedCategories[category.id] ? 'rotate-90' : ''
										)}
									/>
								</button>

								{!collapsedCategories[category.id] && (
									<div className="pl-7 space-y-1">
										{category.panels.map((panel) => (
											<button
												key={panel.id}
												onClick={() => {
													onCategoryChange(category.id);
													onPanelChange(panel.id);
												}}
												className={cn(
													'flex items-center w-full gap-2 px-3 py-2 text-[11px] font-medium rounded-md',
													'hover:bg-secondary/20 transition-all duration-150',
													activePanel === panel.id ? 'bg-secondary/30 text-primary' : 'text-muted-foreground'
												)}
												type="button"
											>
												<span className="flex items-center justify-center" style={{ color: panel.color }}>
													<panel.icon className="h-4 w-4" />
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

export function EntitiesCardsSection() {
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
	const [activePanel, setActivePanel] = useState<string>('presets');

	// Estado para mostrar información
	const [showInfo, setShowInfo] = useState(true);
	const [showControls, setShowControls] = useState(true);

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
				});
				setCardOptions(uiOptions);
			} else {
				// Si no hay opciones guardadas, usar las predeterminadas del tipo de entidad
				const defaultOptions =
					entityTypes.find((e) => e.entityType === activeEntityType)?.options ||
					adaptOptions(DEFAULT_SETTINGS_OPTIONS as unknown as Record<string, unknown>);
				setCardOptions(defaultOptions);
			}
		} catch (error) {
			console.error('Error al cargar opciones de tarjeta:', error);
			setError('No se pudieron cargar las opciones de tarjeta');
			toastService.error('No se pudieron cargar las opciones de tarjeta');
		}
	}, [activeEntityType]);

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
				toastService.error('No se ha seleccionado un tipo de entidad');
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
			};

			// Guardar la configuración en el servidor
			const response = await saveEntityCardConfig(apiEntityType, serverOptionsDto);

			if (response.success) {
				toastService.success(response.message);
			} else {
				setError(response.message);
				toastService.error(response.message);
			}
		} catch (error) {
			console.error('Error al guardar opciones:', error);
			setError('No se pudieron guardar las opciones');
			toastService.error('No se pudieron guardar las opciones');
		} finally {
			setIsSaving(false);
		}
	};

	// Manejar cambios en opciones de tarjeta
	const handleCardOptionsChange = (newOptions: CardOptions) => {
		setCardOptions(newOptions);
		// Solo limpiamos el preset activo si se cambia alguna configuración
		if (activePreset) {
			setActivePreset(null);
		}
	};

	// Manejador para cuando se selecciona un preset
	const handlePresetSelect = (preset: {
		id: string;
		name: string;
		options: CardOptions;
	}) => {
		setCardOptions(preset.options);
		setActivePreset(preset.id);
		toastService.success(`Preset "${preset.name}" aplicado correctamente`);
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
		<Card className="bg-muted/30 rounded-sm">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-base font-medium flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Settings className="h-4 w-4 text-primary" />
						<span>Configuración de Tarjetas de Entidades</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
								</TooltipTrigger>
								<TooltipContent side="top" className="text-xs max-w-xs">
									Personaliza la apariencia de las tarjetas para cada tipo de entidad. Configura rarezas, texturas y
									efectos visuales para mejorar la visualización.
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</CardTitle>
			</CardHeader>

			<Separator className="my-0" />

			<CardContent className="p-3">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[600px]">
					{/* COLUMNA 1: Navegación - Lado izquierdo (2 columnas) */}
					<div className="md:col-span-2 border-r border-border pr-2">
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
					<div className="md:col-span-5 flex flex-col">
						{activeEntity && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
								key={`preview-${activeEntityType}`}
								className="flex flex-col items-center"
							>
								<div className="mb-4 w-full">
									<h3 className="text-[11px] font-medium flex items-center gap-2" style={{ color: activeEntity.color }}>
										{activeEntity.icon}
										Vista previa de {activeEntity.title}
									</h3>
									<p className="text-[10px] text-muted-foreground mt-1">{activeEntity.description}</p>
								</div>

								<div className="relative flex-1 flex items-center justify-center w-full">
									<div className="absolute top-2 right-2 flex gap-2">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
														onClick={() => setShowInfo(!showInfo)}
													>
														<Info className="h-4 w-4" />
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
									</div>

									<EntityCardPreview
										cardOptions={cardOptions}
										entityType={convertEntityId.toApiFormat(activeEntityType)}
										rarity={selectedRarity}
										texture={selectedTexture}
										showInfo={showInfo}
										showControls={showControls}
									/>

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
										</div>
									)}
								</div>

								<Button
									onClick={handleSaveOptions}
									disabled={isSaving}
									className="mt-6 w-fit self-center text-[11px]"
									size="lg"
								>
									<Save className={cn('h-4 w-4 mr-2', isSaving && 'animate-spin')} />
									{isSaving ? 'Guardando cambios...' : 'Guardar configuración'}
								</Button>
							</motion.div>
						)}
					</div>

					{/* COLUMNA 3: Configuración - Lado derecho (5 columnas) */}
					<div className="md:col-span-5 border-l border-border pl-2">
						{activeEntity && (
							<ScrollArea className="h-[calc(100vh-160px)]">
								<div className="space-y-4">
									{/* Renderizar el panel activo basado en activePanel */}
									{activePanel === 'presets' && (
										<PresetsPanel
											activePreset={activePreset}
											onPresetSelect={handlePresetSelect}
											entityType={convertEntityId.toApiFormat(activeEntityType)}
										/>
									)}
									{activePanel === 'systems' && (
										<SystemSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'design' && (
										<DesignSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
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
										<AdvancedEffectsSettings
											options={cardOptions}
											onChange={handleCardOptionsChange}
											disabled={false}
										/>
									)}
									{activePanel === 'filters' && (
										<FiltersSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'patterns' && (
										<PatternsSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'shaders' && (
										<ShadersSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
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
									{activePanel === 'preview' && (
										<PreviewSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
									{activePanel === 'performance' && (
										<PerformanceSettings options={cardOptions} onChange={handleCardOptionsChange} disabled={false} />
									)}
								</div>
							</ScrollArea>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
