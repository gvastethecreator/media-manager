'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sliders, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { CardOptions } from '../../types/card-settings-types';
import { AdvancedEffectsPanel } from './advanced';
import type { EffectsConfig, EffectsPanelProps } from './types';
import { VisualEffectsManager } from './visual';

/**
 * 🎨 Panel de configuración de efectos para Entity Cards
 */
export function EffectsPanel({ config, onChange, cardOptions, onCardOptionsChange }: EffectsPanelProps) {
	const [activeTab, setActiveTab] = useState<string>('visual');

	const handleVisualEffectsChange = (visualEffects: Partial<EffectsConfig['visual']>) => {
		const updatedConfig: EffectsConfig = {
			...config,
			visual: {
				...config.visual,
				...visualEffects,
			},
		};

		onChange(updatedConfig);
	};

	const handleAdvancedEffectsChange = (advancedEffects: Partial<EffectsConfig['advanced']>) => {
		const updatedConfig: EffectsConfig = {
			...config,
			advanced: {
				...config.advanced,
				...advancedEffects,
			},
		};

		onChange(updatedConfig);
	};

	// Manejadores para los cambios de efectos visuales individuales
	const handleHolographicOptionsChange = (holographicOptions: CardOptions['holographicOptions']) => {
		handleVisualEffectsChange({ holographic: holographicOptions });
	};

	const handleScanlinesOptionsChange = (scanlinesOptions: CardOptions['scanlinesOptions']) => {
		handleVisualEffectsChange({ scanlines: scanlinesOptions });
	};

	const handleGlowOptionsChange = (glowOptions: CardOptions['glowOptions']) => {
		handleVisualEffectsChange({ glow: glowOptions });
	};

	const handleBorderOptionsChange = (borderOptions: CardOptions['borderOptions']) => {
		handleVisualEffectsChange({ border: borderOptions });
	};

	const handleGrainOptionsChange = (grainOptions: CardOptions['grainOptions']) => {
		handleVisualEffectsChange({ grain: grainOptions });
	};

	return (
		<Card className="border shadow-sm">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle>Efectos</CardTitle>
					<Badge variant="outline" className="text-xs">
						{activeTab === 'visual' ? 'Visuales' : 'Avanzados'}
					</Badge>
				</div>
				<CardDescription>Configura los efectos visuales y avanzados para las tarjetas de entidad.</CardDescription>
			</CardHeader>

			<CardContent>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="visual" className="flex items-center gap-2">
							<Sparkles className="h-4 w-4" />
							<span className="hidden sm:inline">Efectos Visuales</span>
						</TabsTrigger>
						<TabsTrigger value="advanced" className="flex items-center gap-2">
							<Sliders className="h-4 w-4" />
							<span className="hidden sm:inline">Efectos Avanzados</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="visual" className="mt-4">
						<VisualEffectsManager
							holographicOptions={config.visual.holographic}
							scanlinesOptions={config.visual.scanlines}
							glowOptions={config.visual.glow}
							borderOptions={config.visual.border}
							grainOptions={config.visual.grain}
							onHolographicOptionsChange={handleHolographicOptionsChange}
							onScanlinesOptionsChange={handleScanlinesOptionsChange}
							onGlowOptionsChange={handleGlowOptionsChange}
							onBorderOptionsChange={handleBorderOptionsChange}
							onGrainOptionsChange={handleGrainOptionsChange}
						/>
					</TabsContent>

					<TabsContent value="advanced" className="mt-4">
						<AdvancedEffectsPanel
							distortion={config.advanced.distortion}
							filter={config.advanced.filter}
							shadow={config.advanced.shadow}
							onDistortionChange={(distortion) => handleAdvancedEffectsChange({ distortion })}
							onFilterChange={(filter) => handleAdvancedEffectsChange({ filter })}
							onShadowChange={(shadow) => handleAdvancedEffectsChange({ shadow })}
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
