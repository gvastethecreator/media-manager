'use client';

import { DEFAULT_SETTINGS_OPTIONS } from '@/components/features/entity-cards/config/card-config-defaults';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toastService } from '@/lib/services/toast.service';
import { cn } from '@/lib/utils';
import { BookOpen, Grid, Info, Layers, LayoutTemplate, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { EntityPreviewAdapter } from '../../preview/entity-preview-adapter';

// 🎨 Esquema de colores para el panel de presets
const presetsColors = {
	bg: 'bg-teal-500/5',
	border: 'border-teal-500/20',
	text: 'text-teal-600',
	highlight: 'bg-teal-500/10',
};

// Definición de la interfaz para las opciones de preset
export interface CardPresetOption {
	id: string;
	name: string;
	description: string;
	options: CardOptions;
}

// 📦 Presets de ejemplo
const CARD_PRESETS: CardPresetOption[] = [
	{
		id: 'default',
		name: 'Estándar',
		description: 'Diseño estándar con una sola imagen',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			imageGridLayout: 'single',
			enableScanlines: false,
			enableGrainEffect: false,
			enableLightHalo: false,
			enableAnimatedBorder: false,
		},
	},
	{
		id: 'dual',
		name: 'Dual',
		description: 'Tarjeta con dos imágenes lado a lado',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			imageGridLayout: 'dual',
			imageGridGap: 8,
			enableGrainEffect: true,
			grainOptions: {
				intensity: 0.15,
				density: 0.5,
				noise: 'light',
				animated: false,
			},
		},
	},
	{
		id: 'grid',
		name: 'Cuadrícula',
		description: 'Múltiples imágenes en formato cuadrícula',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			imageGridLayout: 'grid',
			imageGridColumns: 2,
			imageGridRows: 2,
			imageGridGap: 8,
			enableScanlines: true,
			scanlineOptions: {
				opacity: 0.07,
				spacing: 10,
				width: 1,
				animated: false,
			},
		},
	},
	{
		id: 'glowing',
		name: 'Brillante',
		description: 'Efecto de brillo y halo luminoso',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			enableLightHalo: true,
			lightHaloOptions: {
				color: 'rgba(255,255,255,0.7)',
				size: 60,
				blur: 30,
				opacity: 0.7,
			},
			enableGlowEffect: true,
			glowOptions: {
				color: '#ffffff',
				intensity: 10,
				size: 30,
			},
		},
	},
	{
		id: 'retro',
		name: 'Retro',
		description: 'Estilo vintage con efectos de grano y líneas',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			enableGrainEffect: true,
			grainOptions: {
				intensity: 0.2,
				density: 0.8,
				noise: 'heavy',
				animated: true,
				animationSpeed: 5,
			},
			enableScanlines: true,
			scanlineOptions: {
				opacity: 0.15,
				spacing: 8,
				width: 1,
				animated: true,
				animationSpeed: 15,
			},
			colorFilter: 'sepia',
		},
	},
	{
		id: 'animated',
		name: 'Animado',
		description: 'Borde animado y efectos interactivos',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			enableAnimatedBorder: true,
			borderOptions: {
				width: 3,
				style: 'flowing',
				speed: 5,
				color: 'gradient',
			},
			hoverEffect: 'glow',
			hoverEffectOptions: {
				scale: 1.05,
				duration: 0.3,
				intensityMultiplier: 1.5,
			},
		},
	},
	{
		id: 'minimal',
		name: 'Minimalista',
		description: 'Diseño limpio y minimalista',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			displayBorder: false,
			displayShadow: false,
			cornerStyle: 'square',
			fontSize: 'sm',
			contentPadding: 0,
		},
	},
];

/**
 * Props para el componente PresetsPanel
 */
interface PresetsPanelProps {
	activePreset: string | null;
	onPresetSelect: (preset: CardPresetOption) => void;
	entityType?: string;
}

/**
 * Panel de selección de presets para configuraciones de tarjetas
 * @component
 */
export function PresetsPanel({ activePreset, onPresetSelect, entityType = 'album' }: PresetsPanelProps) {
	return (
		<div className={cn('p-4 rounded-lg border', presetsColors.border, presetsColors.bg)}>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className={cn('text-lg font-medium flex items-center gap-2', presetsColors.text)}>
						<LayoutTemplate size={18} />
						Presets
					</h3>
					<p className="text-sm text-muted-foreground">Configuraciones predefinidas para estilos de tarjetas</p>
				</div>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								className="text-muted-foreground hover:text-primary"
								onClick={() =>
									toastService.info(
										'Consejo',
										'Los presets son configuraciones predefinidas que puedes usar como punto de partida.'
									)
								}
							>
								<Info size={16} />
							</button>
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-xs">Selecciona un preset como punto de partida</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{CARD_PRESETS.map((preset) => (
					<PresetCard
						key={preset.id}
						preset={preset}
						isActive={activePreset === preset.id}
						onClick={() => onPresetSelect(preset)}
						entityType={entityType}
					/>
				))}
			</div>
		</div>
	);
}

/**
 * Props para el componente PresetCard
 */
interface PresetCardProps {
	preset: CardPresetOption;
	isActive: boolean;
	onClick: () => void;
	entityType: string;
}

/**
 * Tarjeta individual que muestra un preset con vista previa
 * @component
 */
function PresetCard({ preset, isActive, onClick, entityType }: PresetCardProps) {
	return (
		<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-full">
			<Card
				className={cn(
					'cursor-pointer transition-all overflow-hidden h-full border-2',
					isActive ? `${presetsColors.border} ${presetsColors.highlight}` : 'border-transparent'
				)}
				onClick={onClick}
			>
				<div className="h-32 overflow-hidden relative bg-muted/30">
					<div className="scale-75 origin-top absolute inset-0">
						<EntityPreviewAdapter
							entityType={entityType}
							options={preset.options}
							showBackside={false}
							previewMode="thumbnail"
						/>
					</div>
				</div>
				<CardContent className="p-3">
					<div className="flex items-center gap-2 mb-1">
						{preset.id === 'default' && <BookOpen size={14} />}
						{preset.id === 'dual' && <Layers size={14} />}
						{preset.id === 'grid' && <Grid size={14} />}
						{preset.id === 'glowing' && <Sparkles size={14} />}
						<h4 className="font-medium text-sm">{preset.name}</h4>
					</div>
					<p className="text-xs text-muted-foreground">{preset.description}</p>
				</CardContent>
			</Card>
		</motion.div>
	);
}
