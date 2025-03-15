'use client';

import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormRow, FormSlider, FormToggle } from '../../../settings/panels/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Layers, Paintbrush, Settings, Sliders, Sparkles } from 'lucide-react';

// 🎨 Esquema de colores para el panel
const panelColors = {
	config: {
		bg: 'bg-purple-500/5',
		border: 'border-purple-500/20',
		text: 'text-purple-600',
	},
};

interface ConfigManagerProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
	disabled?: boolean;
}

/**
 * Gestor de configuración de tarjetas que permite modificar múltiples opciones visuales
 * @component
 */
export function ConfigManager({ options, onOptionsChange, disabled = false }: ConfigManagerProps) {
	// 🔄 Manejadores para cambios específicos
	const handle3DEffectChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enable3DEffect: checked,
		});
	};

	const handleHolographicEffectChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enableHolographicEffect: checked,
		});
	};

	const handleScanlinesChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enableScanlines: checked,
		});
	};

	const handleGlowEffectChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enableGlowEffect: checked,
		});
	};

	const handleGrainEffectChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enableGrainEffect: checked,
		});
	};

	const handleHoverLiftChange = (value: number[]) => {
		onOptionsChange({
			...options,
			hoverLift: value[0],
		});
	};

	const handleMaxRotationChange = (value: number[]) => {
		onOptionsChange({
			...options,
			maxRotation: value[0],
		});
	};

	return (
		<Card className={cn('w-full', panelColors.config.bg, panelColors.config.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium flex items-center gap-2">
					<Settings className="h-4 w-4" />
					Configuración de Efectos
				</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Personaliza los efectos visuales y la interactividad de la tarjeta
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ScrollArea className="h-[300px] pr-4">
					<div className="space-y-6">
						{/* Efectos 3D */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Layers className="h-4 w-4 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos 3D</h3>
							</div>

							<FormRow cols={1}>
								<FormToggle
									id="enable-3d-effect"
									label="Efecto 3D"
									description="Habilita el efecto de perspectiva 3D"
									checked={options.enable3DEffect !== undefined ? options.enable3DEffect : true}
									onCheckedChange={handle3DEffectChange}
									disabled={disabled}
								/>
							</FormRow>

							{options.enable3DEffect && (
								<>
									<FormRow>
										<FormSlider
											id="hover-lift"
											label="Elevación al Hover"
											description="Distancia que se eleva la tarjeta al pasar el cursor"
											value={options.hoverLift !== undefined ? [options.hoverLift] : [10]}
											onValueChange={handleHoverLiftChange}
											min={0}
											max={20}
											step={1}
											disabled={disabled}
											unit="px"
										/>
									</FormRow>
									<FormRow>
										<FormSlider
											id="max-rotation"
											label="Rotación Máxima"
											description="Ángulo máximo de rotación de la tarjeta"
											value={options.maxRotation !== undefined ? [options.maxRotation] : [15]}
											onValueChange={handleMaxRotationChange}
											min={0}
											max={30}
											step={1}
											disabled={disabled}
											unit="°"
										/>
									</FormRow>
								</>
							)}
						</div>

						{/* Efectos Visuales */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-muted-foreground" />
								<h3 className="text-xs font-medium">Efectos Visuales</h3>
							</div>

							<FormRow cols={1}>
								<FormToggle
									id="enable-holographic-effect"
									label="Efecto Holográfico"
									description="Aplica un efecto holográfico a la tarjeta"
									checked={options.enableHolographicEffect !== undefined ? options.enableHolographicEffect : false}
									onCheckedChange={handleHolographicEffectChange}
									disabled={disabled}
								/>
							</FormRow>

							<FormRow cols={1}>
								<FormToggle
									id="enable-scanlines"
									label="Líneas de Escáner"
									description="Añade líneas de escáner a la tarjeta"
									checked={options.enableScanlines !== undefined ? options.enableScanlines : false}
									onCheckedChange={handleScanlinesChange}
									disabled={disabled}
								/>
							</FormRow>

							<FormRow cols={1}>
								<FormToggle
									id="enable-glow-effect"
									label="Efecto de Brillo"
									description="Añade un brillo a los bordes de la tarjeta"
									checked={options.enableGlowEffect !== undefined ? options.enableGlowEffect : false}
									onCheckedChange={handleGlowEffectChange}
									disabled={disabled}
								/>
							</FormRow>

							<FormRow cols={1}>
								<FormToggle
									id="enable-grain-effect"
									label="Efecto de Grano"
									description="Añade una textura de grano a la tarjeta"
									checked={options.enableGrainEffect !== undefined ? options.enableGrainEffect : false}
									onCheckedChange={handleGrainEffectChange}
									disabled={disabled}
								/>
							</FormRow>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
