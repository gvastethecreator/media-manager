'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sliders, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { CardOptions } from '../../types/unified-types';
import { AdvancedEffectsPanel } from './advanced';
import type { EffectsConfig, EffectsPanelProps, VisualEffectsOptions, AdvancedEffectsOptions } from './types';
import { VisualEffectsManager } from './visual';
import { effectsStore, EFFECT_MODULES } from '../../store/effects-store';

/**
 * Panel de configuración de efectos para Entity Cards
 * 
 * Este panel proporciona una interfaz para configurar efectos visuales y avanzados,
 * al tiempo que se integra con el almacén centralizado de efectos.
 */
export function EffectsPanel({ config, onChange, cardOptions, onCardOptionsChange }: EffectsPanelProps) {
	const [activeTab, setActiveTab] = useState<string>('visual');

	// Sincronizar con el store cuando cambia la configuración o la pestaña activa
	useEffect(() => {
		// Actualizar el store cuando cambia la configuración
		effectsStore.updateEffects(config);
		
		// Activar el módulo correspondiente según la pestaña activa
		if (activeTab === 'visual') {
			effectsStore.enableModule(EFFECT_MODULES.VISUAL);
		}
		if (activeTab === 'advanced') {
			effectsStore.enableModule(EFFECT_MODULES.ADVANCED);
		}
		
		// Suscripción a cambios en el store
		const unsubscribe = effectsStore.subscribe(() => {
			const storeEffects = effectsStore.getEffects();
			// Solo actualizamos si hay cambios relevantes para evitar ciclos infinitos
			if (JSON.stringify(storeEffects) !== JSON.stringify(config)) {
				onChange({
					...config,
					...storeEffects
				});
			}
		});
		
		return () => {
			unsubscribe();
		};
	}, [config, activeTab, onChange]);

	const handleEffectsChange = (type: 'visual' | 'advanced', effects: Partial<EffectsConfig[typeof type]>) => {
		const updatedConfig: EffectsConfig = {
			...config,
			[type]: {
				...config[type],
				...effects,
			},
		};
		onChange(updatedConfig);
	};

	// Adaptadores para trabajar con los componentes existentes
	const handleVisualEffectsChange = (visualEffects: Partial<VisualEffectsOptions>) => {
		handleEffectsChange('visual', visualEffects);
	};

	const handleAdvancedEffectsChange = (advancedEffects: Partial<AdvancedEffectsOptions>) => {
		handleEffectsChange('advanced', advancedEffects);
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
						<TabsTrigger value="visual" className="flex items-center gap-1">
							<Sparkles className="h-3.5 w-3.5" />
							<span>Visuales</span>
						</TabsTrigger>
						<TabsTrigger value="advanced" className="flex items-center gap-1">
							<Sliders className="h-3.5 w-3.5" />
							<span>Avanzados</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="visual" className="mt-4">
						<VisualEffectsManager
							holographicOptions={config.visual.holographic}
							scanlinesOptions={config.visual.scanlines}
							glowOptions={config.visual.glow}
							borderOptions={config.visual.border}
							grainOptions={config.visual.grain}
							onHolographicOptionsChange={(value) => handleVisualEffectsChange({ holographic: value })}
							onScanlinesOptionsChange={(value) => handleVisualEffectsChange({ scanlines: value })}
							onGlowOptionsChange={(value) => handleVisualEffectsChange({ glow: value })}
							onBorderOptionsChange={(value) => handleVisualEffectsChange({ border: value })}
							onGrainOptionsChange={(value) => handleVisualEffectsChange({ grain: value })}
						/>
					</TabsContent>

					<TabsContent value="advanced" className="mt-4">
						<AdvancedEffectsPanel
							options={cardOptions || {}}
							onChange={onCardOptionsChange || (() => {})}
							disabled={false}
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
