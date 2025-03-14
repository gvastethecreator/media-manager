'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { EyeIcon, FocusIcon, HandIcon, RefreshCwIcon, StarIcon } from 'lucide-react';
import { useState } from 'react';
import type { CardOptions } from '../types';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSeparator,
	FormSlider,
	FormToggle,
	PanelHeader
} from './shared/form-components';
import { panelColors } from './shared/panel-helpers';

/**
 * Interfaz para los estados de Core
 * @typedef {Object} CoreStates
 */
interface CoreStates {
	hover?: {
		scale?: number;
		rotate?: boolean;
		lift?: boolean;
		duration?: number;
		easing?: string;
	};
	active?: {
		scale?: number;
		brightness?: number;
	};
	focus?: {
		scale?: number;
		rotate?: boolean;
		lift?: boolean;
		duration?: number;
		easing?: string;
	};
	disabled?: {
		opacity?: number;
		grayscale?: boolean;
	};
	selected?: {
		scale?: number;
		rotate?: boolean;
		lift?: boolean;
		brightness?: number;
		border?: string;
	};
}

/**
 * Componente para configurar los estados interactivos de las tarjetas
 */
export function StatesSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	const [activeTab, setActiveTab] = useState('hover');

	// Inicializamos los estados del Core o usamos valores por defecto
	const coreStates: CoreStates = options.core?.states || {};

	// Inicializamos valores por defecto si no existen en Core
	const states = {
		// Hover
		hover: coreStates.hover?.rotate !== undefined || coreStates.hover?.lift !== undefined,
		hoverScale: coreStates.hover?.scale ?? 1.03,
		hoverRotate: coreStates.hover?.rotate ? 2 : 0, // Convertimos boolean a número
		hoverTranslateY: coreStates.hover?.lift ? -5 : 0, // Convertimos boolean a número

		// Focus - Migrado a Core
		focus: coreStates.focus?.rotate !== undefined || coreStates.focus?.lift !== undefined,
		focusScale: coreStates.focus?.scale ?? 1.05,
		focusRotate: coreStates.focus?.rotate ? 2 : 0, // Convertimos boolean a número
		focusTranslateY: coreStates.focus?.lift ? -8 : 0, // Convertimos boolean a número

		// Active
		active: coreStates.active !== undefined,
		activeScale: coreStates.active?.scale ?? 0.98,
		activeRotate: options.states?.activeRotate ?? 0,
		activeTranslateY: options.states?.activeTranslateY ?? 0,

		// Selected - Migrado a Core
		selected: coreStates.selected?.scale !== undefined || coreStates.selected?.rotate !== undefined,
		selectedScale: coreStates.selected?.scale ?? 1.07,
		selectedRotate: coreStates.selected?.rotate ? 2 : 0, // Convertimos boolean a número
		selectedTranslateY: coreStates.selected?.lift ? -10 : 0, // Convertimos boolean a número
	};

	// Handler para cambios en las opciones de estados de Core
	const handleCoreStatesChange = (state: string, key: string, value: unknown) => {
		onChange({
			...options,
			core: {
				...options.core,
				states: {
					...options.core?.states,
					[state]: {
						...options.core?.states?.[state],
						[key]: value,
					}
				}
			}
		});
	};

	// Manejador para cambios específicos del hover
	const handleHoverChange = (checked: boolean) => {
		onChange({
			...options,
			core: {
				...options.core,
				states: {
					...options.core?.states,
					hover: checked ? {
						scale: 1.03,
						rotate: true,
						lift: true,
						duration: 200,
						easing: 'cubic-bezier(0.4,0,0.2,1)',
					} : undefined
				}
			}
		});
	};

	// Manejador para cambios específicos del focus
	const handleFocusChange = (checked: boolean) => {
		onChange({
			...options,
			core: {
				...options.core,
				states: {
					...options.core?.states,
					focus: checked ? {
						scale: 1.05,
						rotate: true,
						lift: true,
						duration: 200,
						easing: 'cubic-bezier(0.4,0,0.2,1)',
					} : undefined
				}
			}
		});
	};

	// Manejador para cambios específicos del selected
	const handleSelectedChange = (checked: boolean) => {
		onChange({
			...options,
			core: {
				...options.core,
				states: {
					...options.core?.states,
					selected: checked ? {
						scale: 1.07,
						rotate: true,
						lift: true,
						brightness: 1.1,
						border: '2px solid currentColor',
					} : undefined
				}
			}
		});
	};

	// Manejador para cambios específicos de scale en hover
	const handleHoverScaleChange = (value: number) => {
		handleCoreStatesChange('hover', 'scale', value);
	};

	// Manejador para cambios específicos de rotate en hover
	const handleHoverRotateChange = (value: number) => {
		// Convertimos el número a boolean para Core
		handleCoreStatesChange('hover', 'rotate', value > 0);
	};

	// Manejador para cambios específicos de lift en hover
	const handleHoverLiftChange = (value: number) => {
		// Convertimos el número a boolean para Core
		handleCoreStatesChange('hover', 'lift', value < 0);
	};

	// Manejador para cambios específicos de scale en focus
	const handleFocusScaleChange = (value: number) => {
		handleCoreStatesChange('focus', 'scale', value);
	};

	// Manejador para cambios específicos de rotate en focus
	const handleFocusRotateChange = (value: number) => {
		// Convertimos el número a boolean para Core
		handleCoreStatesChange('focus', 'rotate', value > 0);
	};

	// Manejador para cambios específicos de lift en focus
	const handleFocusLiftChange = (value: number) => {
		// Convertimos el número a boolean para Core
		handleCoreStatesChange('focus', 'lift', value < 0);
	};

	// Manejador para cambios específicos de active
	const handleActiveChange = (checked: boolean) => {
		onChange({
			...options,
			core: {
				...options.core,
				states: {
					...options.core?.states,
					active: checked ? {
						scale: 0.98,
						brightness: 0.95,
					} : undefined
				}
			}
		});
	};

	// Manejador para cambios específicos de scale en active
	const handleActiveScaleChange = (value: number) => {
		handleCoreStatesChange('active', 'scale', value);
	};

	// Manejador para cambios específicos de scale en selected
	const handleSelectedScaleChange = (value: number) => {
		handleCoreStatesChange('selected', 'scale', value);
	};

	// Manejador para cambios específicos de rotate en selected
	const handleSelectedRotateChange = (value: number) => {
		// Convertimos el número a boolean para Core
		handleCoreStatesChange('selected', 'rotate', value > 0);
	};

	// Manejador para cambios específicos de lift en selected
	const handleSelectedLiftChange = (value: number) => {
		// Convertimos el número a boolean para Core
		handleCoreStatesChange('selected', 'lift', value < 0);
	};

	// Mantenemos el handler para los estados que aún no se han migrado a Core
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
		if (statePrefix === 'hover') {
			onChange({
				...options,
				core: {
					...options.core,
					states: {
						...options.core?.states,
						hover: {
							scale: 1.02,
							rotate: true,
							lift: true,
							duration: 200,
							easing: 'cubic-bezier(0.4,0,0.2,1)',
						}
					}
				}
			});
		} else if (statePrefix === 'focus') {
			onChange({
				...options,
				core: {
					...options.core,
					states: {
						...options.core?.states,
						focus: {
							scale: 1.05,
							rotate: true,
							lift: true,
							duration: 200,
							easing: 'cubic-bezier(0.4,0,0.2,1)',
						}
					}
				}
			});
		} else if (statePrefix === 'active') {
			onChange({
				...options,
				core: {
					...options.core,
					states: {
						...options.core?.states,
						active: {
							scale: 0.98,
							brightness: 0.95,
						}
					}
				}
			});
		} else if (statePrefix === 'selected') {
			onChange({
				...options,
				core: {
					...options.core,
					states: {
						...options.core?.states,
						selected: {
							scale: 1.07,
							rotate: true,
							lift: true,
							brightness: 1.1,
							border: '2px solid currentColor',
						}
					}
				}
			});
		} else {
			// Para estados que aún no están migrados a Core
			const resetObj: Record<string, undefined> = {};
			Object.keys(options.states || {}).forEach((key) => {
				if (key.startsWith(statePrefix)) {
					resetObj[key] = undefined;
				}
			});

			onChange({
				...options,
				states: {
					...options.states,
					...resetObj,
					[statePrefix]: false,
				},
			});
		}
	};

	return (
		<Card className={cn('w-full', panelColors.states.bg, panelColors.states.border)}>
			<FormLayout>
				<PanelHeader
					title="Estados Interactivos"
					description="Configura cómo se comportan las tarjetas en diferentes estados de interacción"
				/>

				<Tabs defaultValue="hover" className="w-full" onValueChange={setActiveTab} value={activeTab}>
					<TabsList className="w-full grid grid-cols-4 h-9 mb-4">
						<TabsTrigger value="hover" className="text-xs">
							<EyeIcon className="h-3.5 w-3.5 mr-1" />
							Hover
						</TabsTrigger>
						<TabsTrigger value="focus" className="text-xs">
							<FocusIcon className="h-3.5 w-3.5 mr-1" />
							Focus
						</TabsTrigger>
						<TabsTrigger value="active" className="text-xs">
							<HandIcon className="h-3.5 w-3.5 mr-1" />
							Active
						</TabsTrigger>
						<TabsTrigger value="selected" className="text-xs">
							<StarIcon className="h-3.5 w-3.5 mr-1" />
							Selected
						</TabsTrigger>
					</TabsList>

					{/* Tab de Hover */}
					<TabsContent value="hover" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection>
							<FormToggle
								id="hover"
								label="Activar estado hover"
								description="Habilita efectos especiales cuando el usuario pasa el cursor sobre la tarjeta"
								checked={states.hover}
								onCheckedChange={handleHoverChange}
								disabled={disabled}
							/>
						</FormSection>

						{states.hover && (
							<>
								<FormSection title="Efectos visuales">
									<FormGroup>
										<FormSlider
											id="hoverScale"
											label="Escala"
											description="Factor de escala al pasar el cursor"
											value={states.hoverScale}
											onValueChange={handleHoverScaleChange}
											min={1}
											max={1.2}
											step={0.01}
											disabled={disabled}
										/>

										<FormSlider
											id="hoverRotate"
											label="Rotación"
											description="Ángulo de rotación al pasar el cursor"
											value={states.hoverRotate}
											onValueChange={handleHoverRotateChange}
											min={-5}
											max={5}
											step={0.5}
											unit="°"
											disabled={disabled}
										/>

										<FormSlider
											id="hoverTranslateY"
											label="Elevación"
											description="Desplazamiento vertical al pasar el cursor"
											value={states.hoverTranslateY}
											onValueChange={handleHoverLiftChange}
											min={-20}
											max={20}
											unit="px"
											disabled={disabled}
										/>
									</FormGroup>
								</FormSection>

								<FormSection>
									<FormRow>
										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs h-8"
											onClick={handleResetState('hover')}
											disabled={disabled}
										>
											<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
											Restaurar valores por defecto
										</Button>
									</FormRow>
								</FormSection>
							</>
						)}
					</TabsContent>

					{/* Tab de Focus - Ahora migrado a Core */}
					<TabsContent value="focus" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection>
							<FormToggle
								id="focus"
								label="Activar estado focus"
								description="Habilita efectos especiales cuando la tarjeta recibe el foco"
								checked={states.focus}
								onCheckedChange={handleFocusChange}
								disabled={disabled}
							/>
						</FormSection>

						{states.focus && (
							<>
								<FormSection title="Efectos visuales">
									<FormGroup>
										<FormSlider
											id="focusScale"
											label="Escala"
											description="Factor de escala al recibir el foco"
											value={states.focusScale}
											onValueChange={handleFocusScaleChange}
											min={1}
											max={1.2}
											step={0.01}
											disabled={disabled}
										/>

										<FormSlider
											id="focusRotate"
											label="Rotación"
											description="Ángulo de rotación al recibir el foco"
											value={states.focusRotate}
											onValueChange={handleFocusRotateChange}
											min={-5}
											max={5}
											step={0.5}
											unit="°"
											disabled={disabled}
										/>

										<FormSlider
											id="focusTranslateY"
											label="Elevación"
											description="Desplazamiento vertical al recibir el foco"
											value={states.focusTranslateY}
											onValueChange={handleFocusLiftChange}
											min={-20}
											max={20}
											unit="px"
											disabled={disabled}
										/>
									</FormGroup>
								</FormSection>

								<FormSection>
									<FormRow>
										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs h-8"
											onClick={handleResetState('focus')}
											disabled={disabled}
										>
											<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
											Restaurar valores por defecto
										</Button>
									</FormRow>
								</FormSection>
							</>
						)}
					</TabsContent>

					{/* Tab de Active */}
					<TabsContent value="active" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection>
							<FormToggle
								id="active"
								label="Activar estado active"
								description="Habilita efectos especiales cuando la tarjeta está activa"
								checked={states.active}
								onCheckedChange={handleActiveChange}
								disabled={disabled}
							/>
						</FormSection>

						{states.active && (
							<>
								<FormSection title="Efectos visuales">
									<FormGroup>
										<FormSlider
											id="activeScale"
											label="Escala"
											description="Factor de escala cuando la tarjeta está activa"
											value={states.activeScale}
											onValueChange={handleActiveScaleChange}
											min={0.9}
											max={1.1}
											step={0.01}
											disabled={disabled}
										/>

										<FormSlider
											id="activeRotate"
											label="Rotación"
											description="Ángulo de rotación cuando la tarjeta está activa"
											value={states.activeRotate}
											onValueChange={(value) => handleStatesChange('activeRotate', value)}
											min={-5}
											max={5}
											step={0.5}
											unit="°"
											disabled={disabled}
										/>

										<FormSlider
											id="activeTranslateY"
											label="Elevación"
											description="Desplazamiento vertical cuando la tarjeta está activa"
											value={states.activeTranslateY}
											onValueChange={(value) => handleStatesChange('activeTranslateY', value)}
											min={-20}
											max={20}
											unit="px"
											disabled={disabled}
										/>
									</FormGroup>
								</FormSection>

								<FormSection>
									<FormRow>
										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs h-8"
											onClick={handleResetState('active')}
											disabled={disabled}
										>
											<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
											Restaurar valores por defecto
										</Button>
									</FormRow>
								</FormSection>
							</>
						)}
					</TabsContent>

					{/* Tab de Selected - Ahora migrado a Core */}
					<TabsContent value="selected" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection>
							<FormToggle
								id="selected"
								label="Activar estado selected"
								description="Habilita efectos especiales cuando la tarjeta está seleccionada"
								checked={states.selected}
								onCheckedChange={handleSelectedChange}
								disabled={disabled}
							/>
						</FormSection>

						{states.selected && (
							<>
								<FormSection title="Efectos visuales">
									<FormGroup>
										<FormSlider
											id="selectedScale"
											label="Escala"
											description="Factor de escala cuando la tarjeta está seleccionada"
											value={states.selectedScale}
											onValueChange={handleSelectedScaleChange}
											min={1}
											max={1.2}
											step={0.01}
											disabled={disabled}
										/>

										<FormSlider
											id="selectedRotate"
											label="Rotación"
											description="Ángulo de rotación cuando la tarjeta está seleccionada"
											value={states.selectedRotate}
											onValueChange={handleSelectedRotateChange}
											min={-5}
											max={5}
											step={0.5}
											unit="°"
											disabled={disabled}
										/>

										<FormSlider
											id="selectedTranslateY"
											label="Elevación"
											description="Desplazamiento vertical cuando la tarjeta está seleccionada"
											value={states.selectedTranslateY}
											onValueChange={handleSelectedLiftChange}
											min={-20}
											max={20}
											unit="px"
											disabled={disabled}
										/>
									</FormGroup>
								</FormSection>

								<FormSection>
									<FormRow>
										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs h-8"
											onClick={handleResetState('selected')}
											disabled={disabled}
										>
											<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
											Restaurar valores por defecto
										</Button>
									</FormRow>
								</FormSection>
							</>
						)}
					</TabsContent>
				</Tabs>
			</FormLayout>
		</Card>
	);
}
