'use client';

import type { RaritySystem, TextureSystem } from '@/app/actions/entities-cards/entities-cards.actions';
import { getEntityCardConfig, saveEntityCardConfig } from '@/app/actions/entities-cards/entities-cards.actions';

import { BaseCard } from '@/components/features/entity-cards/base/base-card';
import type { CardOptions as BaseCardOptions } from '@/components/features/entity-cards/base/base-card-types';
import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/base/base-card-types';
import { Alert, AlertDescription } from '@/components/ui/alert-enhanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TypographyH3, TypographyP } from '@/components/ui/typography';
import { toastService } from '@/lib/services/toast.service';
import { cn } from '@/lib/utils/utils';
import {
	AlertCircle,
	Box,
	Grid2X2,
	Images,
	Info,
	Layers,
	LibrarySquare,
	Lightbulb,
	MapPin,
	MessageSquare,
	Package,
	PaintBucket,
	Palette,
	RotateCcw,
	Save,
	Settings,
	Settings2,
	Sliders,
	Sparkles,
	StickyNote,
	Tag as TagIcon,
	Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { adaptBaseToSettingsOptions } from '../base/card-adapter';
import { DEFAULT_SETTINGS_OPTIONS } from './card-config-defaults';
import { CardSettingsPanel } from './card-settings-panel';
import type { CardOptions } from './card-settings-types';
import { EntityCardPreview } from './entity-card-preview';
import { RarityManager } from './rarity-manager';
import { TextureManager } from './texture-manager';

// Interfaz para la transferencia de datos a la API
interface CardConfigurationDto {
	entityType: string;
	enable3DEffect: boolean;
	enableHolographicEffect: boolean;
	enableScanlines: boolean;
	enableLightHalo: boolean;
	enableAnimatedBorder: boolean;
	enableGlowEffect: boolean;
	enableGrainEffect: boolean;
	hoverLiftHeight: number;
	maxRotation: number;
	primaryColor: string;
	secondaryColor: string;
	raritySystem: boolean;
	categorySystem: boolean;
	textureSystem: boolean;

	// Configuración de grid de imágenes
	imageGridLayout?: string; // 'single', 'dual', 'quad', 'six'
	imageGridGap?: number;
	imageGridStyle?: string; // 'standard', 'masonry', 'carousel'
	showImageCount?: boolean;
	imageGridAspectRatio?: string;

	// Opciones como JSON strings para almacenamiento en DB
	holographicOptions?: string;
	scanlinesOptions?: string;
	glowOptions?: string;
	borderOptions?: string;
	grainOptions?: string;
}

// Función para adaptar opciones entre diferentes estructuras de tipo
const adaptOptions = (options: Partial<BaseCardOptions> | Record<string, unknown>): CardOptions => {
	// Convertir imageStyle de objeto a string si es necesario
	const adaptedOptions = { ...options } as Record<string, unknown>;
	if (adaptedOptions.imageStyle && typeof adaptedOptions.imageStyle === 'object') {
		adaptedOptions.imageStyle = 'cover'; // Valor predeterminado compatible
	}

	return adaptBaseToSettingsOptions(adaptedOptions as Partial<BaseCardOptions>);
};

// Interfaz para opciones predeterminadas de cada tipo de entidad
interface EntityTypeOptions {
	entityType: string;
	options: CardOptions;
	title: string;
	description: string;
	icon: ReactNode;
	defaultRarity?: RarityConfig;
	defaultTexture?: TextureConfig;
}

// Lista de tipos de entidades disponibles
const entityTypes: EntityTypeOptions[] = [
	{
		entityType: 'album',
		title: 'Álbumes',
		description: 'Configuración de tarjetas para álbumes',
		icon: <Images className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'collection',
		title: 'Colecciones',
		description: 'Configuración de tarjetas para colecciones',
		icon: <LibrarySquare className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'tag',
		title: 'Etiquetas',
		description: 'Configuración de tarjetas para etiquetas',
		icon: <TagIcon className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'character',
		title: 'Personas',
		description: 'Configuración de tarjetas para personas',
		icon: <Users className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'world-item',
		title: 'Objetos',
		description: 'Configuración de tarjetas para objetos',
		icon: <Package className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'place',
		title: 'Lugares',
		description: 'Configuración de tarjetas para lugares',
		icon: <MapPin className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'concept',
		title: 'Conceptos',
		description: 'Configuración de tarjetas para conceptos',
		icon: <Lightbulb className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'prompt',
		title: 'Prompts',
		description: 'Configuración de tarjetas para prompts',
		icon: <MessageSquare className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
	{
		entityType: 'note',
		title: 'Notas',
		description: 'Configuración de tarjetas para notas',
		icon: <StickyNote className="h-4 w-4" />,
		options: adaptOptions({
			...DEFAULT_SETTINGS_OPTIONS,
			raritySystem: true,
			textureSystem: true,
			categorySystem: false,
			enableLightHalo: false,
		}),
	},
];

export function EntitiesCardsSection() {
	// Estado para el tipo de entidad activo
	const [activeEntityType, setActiveEntityType] = useState<string>('album');

	// Estado para las opciones de la tarjeta activa
	const [cardOptions, setCardOptions] = useState<CardOptions>(
		adaptOptions(DEFAULT_SETTINGS_OPTIONS as unknown as Record<string, unknown>)
	);

	// Estados para sistemas
	const [raritySystem, _setRaritySystem] = useState<RaritySystem | undefined>(undefined);
	const [textureSystem, _setTextureSystem] = useState<TextureSystem | undefined>(undefined);

	// Estados para rareza y textura seleccionadas para vista previa
	const [_selectedRarity, setSelectedRarity] = useState<RarityConfig | null>(null);
	const [_selectedTexture, setSelectedTexture] = useState<TextureConfig | null>(null);

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

			const response = await getEntityCardConfig(activeEntityType);

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

			// Extraemos solo las propiedades que necesitamos enviar al servidor
			const _serverOptionsDto: CardConfigurationDto = {
				entityType: activeEntityType,
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
				imageGridLayout: cardOptions.imageGridLayout,
				imageGridGap: cardOptions.imageGridGap,
				imageGridStyle: cardOptions.imageGridStyle,
				showImageCount: !!cardOptions.showImageCount,
				imageGridAspectRatio: cardOptions.imageGridAspectRatio,
				// Convertir objetos a JSON para almacenamiento
				holographicOptions: cardOptions.holographicOptions ? JSON.stringify(cardOptions.holographicOptions) : undefined,
				scanlinesOptions: cardOptions.scanlinesOptions ? JSON.stringify(cardOptions.scanlinesOptions) : undefined,
				glowOptions: cardOptions.glowOptions ? JSON.stringify(cardOptions.glowOptions) : undefined,
				borderOptions: cardOptions.borderOptions ? JSON.stringify(cardOptions.borderOptions) : undefined,
				grainOptions: cardOptions.grainOptions ? JSON.stringify(cardOptions.grainOptions) : undefined,
			};

			// @ts-ignore - Necesario debido a incompatibilidades entre las interfaces
			const response = await saveEntityCardConfig(activeEntityType);

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

					<div className="flex items-center gap-1.5">
						<Button onClick={handleSaveOptions} disabled={isSaving} size="sm" className="h-7 text-xs">
							<Save className={cn('h-3.5 w-3.5 mr-1', isSaving && 'animate-spin')} />
							{isSaving ? 'Guardando...' : 'Guardar'}
						</Button>
					</div>
				</CardTitle>
			</CardHeader>

			<Separator className="my-0" />

			<CardContent className="p-3">
				<div className="space-y-4">
					<TabsList className="overflow-x-auto flex flex-wrap border rounded-lg p-1 bg-muted/50">
						{entityTypes.map((entityType) => (
							<TabsTrigger
								key={entityType.entityType}
								value={entityType.entityType}
								onClick={() => setActiveEntityType(entityType.entityType)}
								className={cn(
									'min-w-[100px] gap-1.5 text-xs py-1.5',
									activeEntityType === entityType.entityType && 'bg-background text-foreground'
								)}
							>
								{entityType.icon}
								{entityType.title}
							</TabsTrigger>
						))}
					</TabsList>

					{activeEntity && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
							key={activeEntityType}
						>
							<Card>
								<CardContent className="p-3 pt-4 space-y-6">
									<CardSettingsPanel
										cardOptions={cardOptions}
										entityType={activeEntity.entityType}
										onCardOptionsChange={handleCardOptionsChange}
										onRarityChange={handleRaritySelect}
										onTextureChange={handleTextureSelect}
										raritySystem={raritySystem}
										textureSystem={textureSystem}
									/>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
