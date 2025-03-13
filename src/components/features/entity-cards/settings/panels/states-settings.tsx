'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { EyeIcon, FocusIcon, HandIcon, StarIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CardOptions } from '../types';
import { SliderOption, ToggleOption, createNestedOptionChangeHandler, panelColors } from './shared/panel-helpers';

// Componente para cada tab de estado
function StateTab({
	title,
	icon,
	children,
}: {
	title: string;
	icon: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-1.5">
				{icon}
				<h3 className="text-xs font-medium">{title}</h3>
			</div>
			<div className="space-y-3">{children}</div>
		</div>
	);
}

export function StatesSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Handler para cambios en las opciones de estados
	const handleStatesChange = (key: keyof NonNullable<CardOptions['states']>, value: unknown) => {
		onChange({
			...options,
			states: {
				...options.states,
				[key]: value,
			},
		});
	};

	// Manejador para resetear los cambios de un estado específico
	const handleResetState = (statePrefix: string) => () => {
		const resetObj: Record<string, undefined> = {};
		const states = options.states || {};

		// Obtener todas las claves del objeto states que comienzan con el prefijo
		Object.keys(states).forEach((key) => {
			if (key.startsWith(statePrefix)) {
				resetObj[key] = undefined;
			}
		});

		// Aplicar el reset
		onChange({
			...options,
			states: {
				...states,
				...resetObj,
				[statePrefix]: false,
			},
		});
	};

	return (
		<Card className={cn('w-full', panelColors.states.bg, panelColors.states.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium">Estados Interactivos</CardTitle>
				<CardDescription className="text-xs text-muted-foreground">
					Configura cómo se comportan las tarjetas en diferentes estados de interacción
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<Tabs defaultValue="hover" className="w-full">
					<TabsList className="w-full grid grid-cols-4 h-8">
						<TabsTrigger value="hover" className="text-[10px] py-1">
							Hover
						</TabsTrigger>
						<TabsTrigger value="focus" className="text-[10px] py-1">
							Focus
						</TabsTrigger>
						<TabsTrigger value="active" className="text-[10px] py-1">
							Active
						</TabsTrigger>
						<TabsTrigger value="selected" className="text-[10px] py-1">
							Selected
						</TabsTrigger>
					</TabsList>

					<ScrollArea className="h-[300px] mt-4 pr-4">
						{/* Tab de Hover */}
						<TabsContent value="hover" className="mt-0">
							<StateTab title="Estado Hover" icon={<EyeIcon className="h-3.5 w-3.5 text-muted-foreground" />}>
								<ToggleOption
									id="hover"
									label="Activar estado hover"
									description="Habilita efectos especiales cuando el usuario pasa el cursor sobre la tarjeta"
									checked={options.states?.hover ?? true}
									onCheckedChange={(checked) => handleStatesChange('hover', checked)}
									disabled={disabled}
								/>

								{options.states?.hover && (
									<>
										<SliderOption
											id="hoverScale"
											label="Escala"
											description="Factor de escala al pasar el cursor"
											value={options.states?.hoverScale ?? 1.03}
											onValueChange={(value) => handleStatesChange('hoverScale', value)}
											min={1}
											max={1.2}
											step={0.01}
											disabled={disabled}
										/>

										<SliderOption
											id="hoverRotate"
											label="Rotación"
											description="Ángulo de rotación al pasar el cursor"
											value={options.states?.hoverRotate ?? 0}
											onValueChange={(value) => handleStatesChange('hoverRotate', value)}
											min={-5}
											max={5}
											step={0.5}
											unit="°"
											disabled={disabled}
										/>

										<SliderOption
											id="hoverTranslateY"
											label="Elevación"
											description="Desplazamiento vertical al pasar el cursor"
											value={options.states?.hoverTranslateY ?? -5}
											onValueChange={(value) => handleStatesChange('hoverTranslateY', value)}
											min={-20}
											max={20}
											unit="px"
											disabled={disabled}
										/>

										<Separator className="my-2" />

										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs h-7 mt-2"
											onClick={handleResetState('hover')}
											disabled={disabled}
										>
											Restaurar valores por defecto
										</Button>
									</>
								)}
							</StateTab>
						</TabsContent>

						{/* Tab de Focus */}
						<TabsContent value="focus" className="mt-0">
							<StateTab title="Estado Focus" icon={<FocusIcon className="h-3.5 w-3.5 text-muted-foreground" />}>
								<ToggleOption
									id="focus"
									label="Activar estado focus"
									description="Habilita efectos especiales cuando la tarjeta recibe el foco"
									checked={options.states?.focus ?? false}
									onCheckedChange={(checked) => handleStatesChange('focus', checked)}
									disabled={disabled}
								/>

								{options.states?.focus && (
									<>
										<SliderOption
											id="focusScale"
											label="Escala"
											description="Factor de escala al recibir el foco"
											value={options.states?.focusScale ?? 1.05}
											onValueChange={(value) => handleStatesChange('focusScale', value)}
											min={1}
											max={1.2}
											step={0.01}
											disabled={disabled}
										/>

										<SliderOption
											id="focusRotate"
											label="Rotación"
											description="Ángulo de rotación al recibir el foco"
											value={options.states?.focusRotate ?? 0}
											onValueChange={(value) => handleStatesChange('focusRotate', value)}
											min={-5}
											max={5}
											step={0.5}
											unit="°"
											disabled={disabled}
										/>

										<SliderOption
											id="focusTranslateY"
											label="Elevación"
											description="Desplazamiento vertical al recibir el foco"
											value={options.states?.focusTranslateY ?? -8}
											onValueChange={(value) => handleStatesChange('focusTranslateY', value)}
											min={-20}
											max={20}
											unit="px"
											disabled={disabled}
										/>

										<Separator className="my-2" />

										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs h-7 mt-2"
											onClick={handleResetState('focus')}
											disabled={disabled}
										>
											Restaurar valores por defecto
										</Button>
									</>
								)}
							</StateTab>
						</TabsContent>

						{/* Tab de Active */}
						<TabsContent value="active" className="mt-0">
							<StateTab title="Estado Active" icon={<HandIcon className="h-3.5 w-3.5 text-muted-foreground" />}>
								<ToggleOption
									id="active"
									label="Activar estado active"
									description="Habilita efectos especiales cuando el usuario hace clic"
									checked={options.states?.active ?? false}
									onCheckedChange={(checked) => handleStatesChange('active', checked)}
									disabled={disabled}
								/>

								{options.states?.active && (
									<>
										<SliderOption
											id="activeScale"
											label="Escala"
											description="Factor de escala al hacer clic"
											value={options.states?.activeScale ?? 0.98}
											onValueChange={(value) => handleStatesChange('activeScale', value)}
											min={0.9}
											max={1.1}
											step={0.01}
											disabled={disabled}
										/>

										<SliderOption
											id="activeRotate"
											label="Rotación"
											description="Ángulo de rotación al hacer clic"
											value={options.states?.activeRotate ?? 0}
											onValueChange={(value) => handleStatesChange('activeRotate', value)}
											min={-5}
											max={5}
											step={0.5}
											unit="°"
											disabled={disabled}
										/>

										<SliderOption
											id="activeTranslateY"
											label="Elevación"
											description="Desplazamiento vertical al hacer clic"
											value={options.states?.activeTranslateY ?? 2}
											onValueChange={(value) => handleStatesChange('activeTranslateY', value)}
											min={-20}
											max={20}
											unit="px"
											disabled={disabled}
										/>

										<Separator className="my-2" />

										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs h-7 mt-2"
											onClick={handleResetState('active')}
											disabled={disabled}
										>
											Restaurar valores por defecto
										</Button>
									</>
								)}
							</StateTab>
						</TabsContent>

						{/* Tab de Selected */}
						<TabsContent value="selected" className="mt-0">
							<StateTab title="Estado Selected" icon={<StarIcon className="h-3.5 w-3.5 text-muted-foreground" />}>
								<ToggleOption
									id="selected"
									label="Activar estado selected"
									description="Habilita efectos especiales cuando la tarjeta está seleccionada"
									checked={options.states?.selected ?? false}
									onCheckedChange={(checked) => handleStatesChange('selected', checked)}
									disabled={disabled}
								/>

								{options.states?.selected && (
									<>
										<SliderOption
											id="selectedScale"
											label="Escala"
											description="Factor de escala cuando está seleccionada"
											value={options.states?.selectedScale ?? 1.05}
											onValueChange={(value) => handleStatesChange('selectedScale', value)}
											min={1}
											max={1.2}
											step={0.01}
											disabled={disabled}
										/>

										<SliderOption
											id="selectedRotate"
											label="Rotación"
											description="Ángulo de rotación cuando está seleccionada"
											value={options.states?.selectedRotate ?? 0}
											onValueChange={(value) => handleStatesChange('selectedRotate', value)}
											min={-5}
											max={5}
											step={0.5}
											unit="°"
											disabled={disabled}
										/>

										<SliderOption
											id="selectedTranslateY"
											label="Elevación"
											description="Desplazamiento vertical cuando está seleccionada"
											value={options.states?.selectedTranslateY ?? -10}
											onValueChange={(value) => handleStatesChange('selectedTranslateY', value)}
											min={-20}
											max={20}
											unit="px"
											disabled={disabled}
										/>

										<Separator className="my-2" />

										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs h-7 mt-2"
											onClick={handleResetState('selected')}
											disabled={disabled}
										>
											Restaurar valores por defecto
										</Button>
									</>
								)}
							</StateTab>
						</TabsContent>
					</ScrollArea>
				</Tabs>
			</CardContent>
		</Card>
	);
}
