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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toastService } from '@/lib/services/toast.service';
import { cn } from '@/lib/utils/utils';
import {
	AlertCircle,
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
import { AdvancedEffectsSettings } from './panels/advanced-effects-settings';
import { DesignSettings } from './panels/design-settings';
import { ImageGridSettings } from './panels/image-grid-settings';
import { PerformanceSettings } from './panels/performance-settings';
import { StatesSettings } from './panels/states-settings';
import { SystemsSettings } from './panels/systems-settings';
import { VisualEffectsSettings } from './panels/visual-effects-settings';
import { PresetsPanel } from './presets/presets-panel';
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

// Colores para cada sección de configuración
const sectionColors = {
	presets: 'from-blue-50 to-blue-100/10 dark:from-blue-950/10 dark:to-blue-900/5',
	visual: 'from-indigo-50 to-indigo-100/10 dark:from-indigo-950/10 dark:to-indigo-900/5',
	system: 'from-violet-50 to-violet-100/10 dark:from-violet-950/10 dark:to-violet-900/5',
	images: 'from-pink-50 to-pink-100/10 dark:from-pink-950/10 dark:to-pink-900/5',
	advanced: 'from-cyan-50 to-cyan-100/10 dark:from-cyan-950/10 dark:to-cyan-900/5',
	design: 'from-emerald-50 to-emerald-100/10 dark:from-emerald-950/10 dark:to-emerald-900/5',
	performance: 'from-amber-50 to-amber-100/10 dark:from-amber-950/10 dark:to-amber-900/5',
	states: 'from-orange-50 to-orange-100/10 dark:from-orange-950/10 dark:to-orange-900/5',
};

// Componente para una sección con color de fondo
const SettingsSection = ({
	children,
	colorClass,
	title,
	icon,
}: {
	children: React.ReactNode;
	colorClass: string;
	title?: string;
	icon?: ReactNode;
}) => {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className={cn('rounded-md bg-gradient-to-br p-0.5 mb-3', colorClass)}
		>
			<div className="bg-card rounded-md p-3">
				{title && (
					<div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
						{icon}
						<h3 className="text-sm font-medium">{title}</h3>
					</div>
				)}
				{children}
			</div>
		</motion.div>
	);
};

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

// Componente para la columna de configuraciones
const ConfigurationPanel = ({
	activeEntityType,
	activePreset,
	cardOptions,
	onCardOptionsChange,
	onPresetSelect,
	onRarityChange,
	onTextureChange,
	activeEntity,
}: {
	activeEntityType: string;
	activePreset: string | null;
	cardOptions: CardOptions;
	onCardOptionsChange: (options: CardOptions) => void;
	onPresetSelect: (preset: {
		id: string;
		name: string;
		options: CardOptions;
	}) => void;
	onRarityChange: (config: RarityConfig | null) => void;
	onTextureChange: (config: TextureConfig | null) => void;
	activeEntity: EntityTypeOptions | undefined;
}) => {
	// Agrupamos las secciones por categorías para una mejor organización
	const configSections = [
		{
			id: 'basic',
			title: 'Configuración Básica',
			panels: [
				{
					id: 'presets',
					title: 'Presets y Plantillas',
					icon: <LayoutGrid className="h-4 w-4 text-blue-500" />,
					colorClass: sectionColors.presets,
					component: (
						<PresetsPanel
							activePreset={activePreset}
							onPresetSelect={onPresetSelect}
							entityType={convertEntityId.toApiFormat(activeEntityType)}
						/>
					),
				},
				{
					id: 'systems',
					title: 'Sistemas y Atributos',
					icon: <PaintBucket className="h-4 w-4 text-violet-500" />,
					colorClass: sectionColors.system,
					component: (
						<SystemsSettings
							cardOptions={cardOptions}
							onCardOptionsChange={onCardOptionsChange}
							entityType={convertEntityId.toApiFormat(activeEntityType)}
							onRarityChange={onRarityChange}
							onTextureChange={onTextureChange}
						/>
					),
				},
			],
		},
		{
			id: 'appearance',
			title: 'Apariencia',
			panels: [
				{
					id: 'visual',
					title: 'Efectos Visuales',
					icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
					colorClass: sectionColors.visual,
					component: <VisualEffectsSettings cardOptions={cardOptions} onCardOptionsChange={onCardOptionsChange} />,
				},
				{
					id: 'design',
					title: 'Diseño y Colores',
					icon: <Palette className="h-4 w-4 text-emerald-500" />,
					colorClass: sectionColors.design,
					component: <DesignSettings cardOptions={cardOptions} onCardOptionsChange={onCardOptionsChange} />,
				},
				{
					id: 'advanced',
					title: 'Efectos Avanzados',
					icon: <Settings2 className="h-4 w-4 text-cyan-500" />,
					colorClass: sectionColors.advanced,
					component: <AdvancedEffectsSettings cardOptions={cardOptions} onCardOptionsChange={onCardOptionsChange} />,
				},
			],
		},
		{
			id: 'content',
			title: 'Contenido',
			panels: [
				{
					id: 'images',
					title: 'Imágenes y Multimedia',
					icon: <Grid2X2 className="h-4 w-4 text-pink-500" />,
					colorClass: sectionColors.images,
					component: <ImageGridSettings cardOptions={cardOptions} onCardOptionsChange={onCardOptionsChange} />,
				},
				{
					id: 'states',
					title: 'Estados Interactivos',
					icon: <Repeat className="h-4 w-4 text-orange-500" />,
					colorClass: sectionColors.states,
					component: <StatesSettings cardOptions={cardOptions} onCardOptionsChange={onCardOptionsChange} />,
				},
			],
		},
		{
			id: 'technical',
			title: 'Técnico',
			panels: [
				{
					id: 'performance',
					title: 'Rendimiento y Optimización',
					icon: <Laptop className="h-4 w-4 text-amber-500" />,
					colorClass: sectionColors.performance,
					component: <PerformanceSettings cardOptions={cardOptions} onCardOptionsChange={onCardOptionsChange} />,
				},
				{
					id: 'preview',
					title: 'Opciones de Vista Previa',
					icon: <Eye className="h-4 w-4 text-blue-500" />,
					colorClass: sectionColors.presets,
					component: (
						<PreviewPanel cardOptions={cardOptions} entityType={convertEntityId.toApiFormat(activeEntityType)} />
					),
				},
			],
		},
	];

	if (!activeEntity) {
		return null;
	}

	return (
		<ScrollArea className="h-[calc(100vh-160px)] pr-2">
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
				key={`config-${activeEntityType}`}
				className="py-2"
			>
				<div className="mb-4">
					<h3 className="text-sm font-medium flex items-center gap-2" style={{ color: activeEntity.color }}>
						<Settings className="h-4 w-4" />
						Configuración para {activeEntity.title}
					</h3>
					<p className="text-xs text-muted-foreground mt-1">Personaliza todos los aspectos de las tarjetas</p>
				</div>

				{configSections.map((section) => (
					<div key={section.id} className="mb-6">
						<div className="mb-2 pb-1 border-b border-border">
							<h4 className="text-sm font-medium text-muted-foreground">{section.title}</h4>
						</div>
						{section.panels.map((panel) => (
							<SettingsSection key={panel.id} colorClass={panel.colorClass} title={panel.title} icon={panel.icon}>
								{panel.component}
							</SettingsSection>
						))}
					</div>
				))}
			</motion.div>
		</ScrollArea>
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

	// Manejar selección de rareza para vista previa
	const handleRaritySelect = (rarityConfig: RarityConfig | null) => {
		setSelectedRarity(rarityConfig);
	};

	// Manejar selección de textura para vista previa
	const handleTextureSelect = (textureConfig: TextureConfig | null) => {
		setSelectedTexture(textureConfig);
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
						<ScrollArea className="h-[calc(100vh-160px)]">
							<div className="space-y-1 py-2">
								{entityTypes.map((entityType) => (
									<button
										key={entityType.entityType}
										onClick={() => setActiveEntityType(entityType.entityType)}
										className={cn(
											'flex items-center w-full gap-2 px-3 py-2 text-sm font-medium rounded-md',
											'hover:bg-secondary/20 transition-all duration-150',
											activeEntityType === entityType.entityType
												? 'bg-secondary/30 text-primary'
												: 'text-muted-foreground'
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
						</ScrollArea>
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
									<h3 className="text-sm font-medium flex items-center gap-2" style={{ color: activeEntity.color }}>
										{activeEntity.icon}
										Vista previa de {activeEntity.title}
									</h3>
									<p className="text-xs text-muted-foreground mt-1">{activeEntity.description}</p>
								</div>

								<div className="flex-1 flex items-center justify-center w-full">
									<EntityCardPreview
										cardOptions={cardOptions}
										entityType={convertEntityId.toApiFormat(activeEntityType)}
										rarity={selectedRarity}
										texture={selectedTexture}
										showInfo={true}
									/>
								</div>

								{/* Botón de guardar debajo de la vista previa */}
								<Button onClick={handleSaveOptions} disabled={isSaving} className="mt-6 w-fit self-center" size="lg">
									<Save className={cn('h-4 w-4 mr-2', isSaving && 'animate-spin')} />
									{isSaving ? 'Guardando cambios...' : 'Guardar configuración'}
								</Button>
							</motion.div>
						)}
					</div>

					{/* COLUMNA 3: Configuración - Lado derecho (5 columnas) */}
					<div className="md:col-span-5 border-l border-border pl-2">
						{activeEntity && (
							<ConfigurationPanel
								activeEntityType={activeEntityType}
								activePreset={activePreset}
								cardOptions={cardOptions}
								onCardOptionsChange={handleCardOptionsChange}
								onPresetSelect={handlePresetSelect}
								onRarityChange={handleRaritySelect}
								onTextureChange={handleTextureSelect}
								activeEntity={activeEntity}
							/>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
