'use client';

import { DEFAULT_SETTINGS_OPTIONS } from '@/components/features/entity-cards/config/card-config-defaults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toastService } from '@/lib/services/toast.service';
import { cn } from '@/lib/utils/utils';
import { BookOpen, Grid, Info, Layers, LayoutTemplate, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import type { CardOptions, CardPresetOption } from '../../types/card-settings-types';
import { EntityPreviewAdapter } from '../preview/entity-preview-adapter';

// Esquema de colores para el panel de presets
const presetsColors = {
	bg: 'bg-teal-500/5',
	border: 'border-teal-500/20',
	text: 'text-teal-600',
	highlight: 'bg-teal-500/10',
};

// Presets de ejemplo
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
		id: 'quad',
		name: 'Cuadrante',
		description: 'Tarjeta con cuatro imágenes en cuadrícula',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			imageGridLayout: 'quad',
			imageGridGap: 4,
			enableScanlines: true,
			scanlinesOptions: {
				opacity: 0.1,
				spacing: 4,
				direction: 'horizontal',
				animate: true,
			},
		},
	},
	{
		id: 'six',
		name: 'Galería',
		description: 'Tarjeta con seis imágenes en formato galería',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			imageGridLayout: 'six',
			imageGridGap: 2,
			enableAnimatedBorder: true,
			borderOptions: {
				width: 2,
				pattern: 'solid',
				animationType: 'pulse',
				animation: {
					type: 'pulse',
					duration: 3000,
					timing: 'linear',
					iteration: 'infinite',
				},
			},
		},
	},
	{
		id: 'minimal',
		name: 'Minimalista',
		description: 'Diseño simplificado sin información adicional',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			imageGridLayout: 'single',
			showTitle: false,
			showDescription: false,
			showRarity: false,
			showType: false,
			showInfo: false,
			enableLightHalo: true,
		},
	},
	{
		id: 'complete',
		name: 'Completo',
		description: 'Tarjeta completa con todos los efectos visuales',
		options: {
			...DEFAULT_SETTINGS_OPTIONS,
			imageGridLayout: 'dual',
			imageGridGap: 6,
			enableScanlines: true,
			enableGrainEffect: true,
			enableLightHalo: true,
			enableAnimatedBorder: true,
			scanlinesOptions: {
				opacity: 0.1,
				spacing: 5,
				direction: 'horizontal',
				animate: true,
			},
			grainOptions: {
				intensity: 0.2,
				density: 0.7,
				noise: 'film',
				animated: true,
			},
			borderOptions: {
				width: 3,
				pattern: 'gradient',
				animationType: 'rainbow',
				animation: {
					type: 'rainbow',
					duration: 3000,
					timing: 'linear',
					iteration: 'infinite',
				},
			},
		},
	},
];

interface PresetsPanelProps {
	activePreset: string | null;
	onPresetSelect: (preset: CardPresetOption) => void;
	entityType?: string;
}

export function PresetsPanel({ activePreset, onPresetSelect, entityType = 'album' }: PresetsPanelProps) {
	return (
		<Card className={cn('border border-border/40 shadow-sm', presetsColors.border)}>
			<CardHeader className="p-2.5 pb-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5">
					<Grid className={cn('h-3.5 w-3.5', presetsColors.text)} />
					<span>Presets</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
							</TooltipTrigger>
							<TooltipContent side="top" className="text-[10px] max-w-[180px]">
								Selecciona un diseño predefinido para tu tarjeta con diferentes estilos y configuraciones
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2.5 pt-1.5">
				<div className="grid grid-cols-2 gap-2">
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
			</CardContent>
		</Card>
	);
}

interface PresetCardProps {
	preset: CardPresetOption;
	isActive: boolean;
	onClick: () => void;
	entityType: string;
}

function PresetCard({ preset, isActive, onClick, entityType }: PresetCardProps) {
	// Escala de la preview
	const scale = 0.4;

	return (
		<motion.div
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className={cn(
				'relative rounded-md border cursor-pointer overflow-hidden group',
				isActive ? 'border-teal-500 ring-1 ring-teal-500 bg-teal-50/10' : 'border-border'
			)}
			onClick={onClick}
		>
			<div className="p-1.5 pb-1">
				<div className="text-[10px] font-medium">{preset.name}</div>
				<div className="text-[9px] text-muted-foreground line-clamp-1">{preset.description}</div>
			</div>

			{/* Preview en miniatura */}
			<div className="flex justify-center items-center p-1.5 pt-0 bg-background/40 rounded-b-md">
				<div
					style={{
						transform: `scale(${scale})`,
						transformOrigin: 'top center',
						height: '140px',
					}}
				>
					<EntityPreviewAdapter cardOptions={preset.options} entityType={entityType} showInfo={false} />
				</div>
			</div>

			{/* Indicadores de características */}
			<div className="absolute bottom-1 right-1 flex gap-0.5">
				{preset.options.enableScanlines && (
					<span className="text-purple-500 bg-purple-100 dark:bg-purple-950/30 p-0.5 rounded-sm">
						<Layers size={8} />
					</span>
				)}
				{preset.options.enableGrainEffect && (
					<span className="text-amber-500 bg-amber-100 dark:bg-amber-950/30 p-0.5 rounded-sm">
						<BookOpen size={8} />
					</span>
				)}
				{(preset.options.enableLightHalo || preset.options.enableAnimatedBorder) && (
					<span className="text-cyan-500 bg-cyan-100 dark:bg-cyan-950/30 p-0.5 rounded-sm">
						<Sparkles size={8} />
					</span>
				)}
			</div>

			{/* Indicador activo */}
			{isActive && (
				<div className="absolute top-0 left-0 w-full h-full border-2 border-teal-500 rounded-md pointer-events-none" />
			)}
		</motion.div>
	);
}

export const presets: Record<string, CardOptions> = {
	default: {
		...DEFAULT_SETTINGS_OPTIONS,
	},
	minimal: {
		...DEFAULT_SETTINGS_OPTIONS,
		// ... existing code ...
	},
	futuristic: {
		...DEFAULT_SETTINGS_OPTIONS,
		// ... existing code ...
	},
	retro: {
		...DEFAULT_SETTINGS_OPTIONS,
		// ... existing code ...
	},
	elegant: {
		...DEFAULT_SETTINGS_OPTIONS,
		// ... existing code ...
	},
	playful: {
		...DEFAULT_SETTINGS_OPTIONS,
		// ... existing code ...
	},
};
