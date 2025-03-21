'use client';

import { FormGroup, FormLayout, FormRow, FormSection, FormSlider, FormToggle } from '@/components/features/entity-cards/settings-old/panels/shared';
import { Button } from '@/components/ui/button';
import { EyeIcon, FocusIcon, HandIcon, RefreshCwIcon, StarIcon } from 'lucide-react';
import { useState } from 'react';
import type { StatesSystem } from './types';

interface StatesPanelProps {
	statesSystem: StatesSystem;
	onChange: (system: StatesSystem) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Panel de configuración para los estados interactivos de tarjetas
 */
export function StatesPanel({ statesSystem, onChange, disabled = false, className }: StatesPanelProps) {
	const [activeTab, setActiveTab] = useState('hover');

	// Inicializamos valores para la UI
	const states = {
		// Hover
		hover: !!statesSystem.hover,
		hoverScale: statesSystem.hover?.scale ?? 1.02,
		hoverRotate: statesSystem.hover?.rotate ? 2 : 0, // Convertimos boolean a número
		hoverTranslateY: statesSystem.hover?.lift ? -5 : 0, // Convertimos boolean a número

		// Focus
		focus: !!statesSystem.focus,
		focusScale: statesSystem.focus?.scale ?? 1.05,
		focusRotate: statesSystem.focus?.rotate ? 2 : 0, // Convertimos boolean a número
		focusTranslateY: statesSystem.focus?.lift ? -8 : 0, // Convertimos boolean a número

		// Active
		active: !!statesSystem.active,
		activeScale: statesSystem.active?.scale ?? 0.98,

		// Disabled
		disabled: !!statesSystem.disabled,
		disabledOpacity: statesSystem.disabled?.opacity ?? 0.5,
		disabledGrayscale: statesSystem.disabled?.grayscale ?? true,

		// Selected
		selected: !!statesSystem.selected,
		selectedScale: statesSystem.selected?.scale ?? 1.07,
		selectedRotate: statesSystem.selected?.rotate ? 2 : 0, // Convertimos boolean a número
		selectedTranslateY: statesSystem.selected?.lift ? -10 : 0, // Convertimos boolean a número
	};

	// Handler para cambios en estados
	const handleStateChange = (stateName: keyof StatesSystem, enabled: boolean) => {
		if (enabled) {
			// Habilitar el estado con valores predeterminados
			const defaultValues: Record<
				string,
				{
					scale?: number;
					rotate?: boolean;
					lift?: boolean;
					duration?: number;
					easing?: string;
					translateX?: number;
					translateY?: number;
					delay?: number;
				}
			> = {
				hover: {
					scale: 1.02,
					rotate: true,
					lift: true,
					duration: 200,
					easing: 'cubic-bezier(0.4,0,0.2,1)',
				},
				focus: {
					scale: 1.05,
					rotate: true,
					lift: true,
					duration: 200,
					easing: 'cubic-bezier(0.4,0,0.2,1)',
				},
				active: {
					scale: 0.98,
					brightness: 0.95,
				},
				disabled: {
					opacity: 0.5,
					grayscale: true,
				},
				selected: {
					scale: 1.07,
					rotate: true,
					lift: true,
					brightness: 1.1,
					border: '2px solid currentColor',
				},
			};

			onChange({
				...statesSystem,
				[stateName]: defaultValues[stateName],
			});
		} else {
			// Deshabilitar el estado
			const updatedSystem = { ...statesSystem };
			delete updatedSystem[stateName];
			onChange(updatedSystem);
		}
	};

	// Handler para cambios en propiedades específicas de estados
	const handleStatePropertyChange = (stateName: keyof StatesSystem, propertyName: string, value: unknown) => {
		onChange({
			...statesSystem,
			[stateName]: {
				...statesSystem[stateName],
				config: {
					...statesSystem[stateName].config,
					[propertyName]: value,
				},
			},
		});
	};

	// Manejador para cambios específicos de rotate/lift basados en valor numérico
	const handleRotateOrLiftChange = (stateName: keyof StatesSystem, propertyName: 'rotate' | 'lift', value: number) => {
		const booleanValue = propertyName === 'rotate' ? value > 0 : value < 0;

		onChange({
			...statesSystem,
			[stateName]: {
				...statesSystem[stateName],
				[propertyName]: booleanValue,
			},
		});
	};

	// Manejador para resetear un estado específico
	const handleResetState = (stateName: keyof StatesSystem) => {
		const defaultValues: Record<
			string,
			{
				scale?: number;
				rotate?: boolean;
				lift?: boolean;
				duration?: number;
				easing?: string;
				translateX?: number;
				translateY?: number;
				delay?: number;
			}
		> = {
			hover: {
				scale: 1.02,
				rotate: true,
				lift: true,
				duration: 200,
				easing: 'cubic-bezier(0.4,0,0.2,1)',
			},
			focus: {
				scale: 1.05,
				rotate: true,
				lift: true,
				duration: 200,
				easing: 'cubic-bezier(0.4,0,0.2,1)',
			},
			active: {
				scale: 0.98,
				brightness: 0.95,
			},
			disabled: {
				opacity: 0.5,
				grayscale: true,
			},
			selected: {
				scale: 1.07,
				rotate: true,
				lift: true,
				brightness: 1.1,
				border: '2px solid currentColor',
			},
		};

		onChange({
			...statesSystem,
			[stateName]: defaultValues[stateName],
		});
	};

	return (
		<FormLayout
			title="Estados Interactivos"
			description="Configura cómo se comportan las tarjetas en diferentes estados de interacción"
			colorScheme="states"
			className={className}
			tabs={[
				{ value: 'hover', label: 'Hover', icon: <EyeIcon className="h-3.5 w-3.5" /> },
				{ value: 'focus', label: 'Focus', icon: <FocusIcon className="h-3.5 w-3.5" /> },
				{ value: 'active', label: 'Active', icon: <HandIcon className="h-3.5 w-3.5" /> },
				{ value: 'selected', label: 'Selected', icon: <StarIcon className="h-3.5 w-3.5" /> },
			]}
			onTabChange={setActiveTab}
			activeTab={activeTab}
		>
			{activeTab === 'hover' && (
				<>
					<FormSection>
						<FormToggle
							id="hover"
							label="Activar estado hover"
							description="Habilita efectos especiales cuando el usuario pasa el cursor sobre la tarjeta"
							checked={states.hover}
							onCheckedChange={(checked) => handleStateChange('hover', checked)}
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
										onValueChange={(value) => handleStatePropertyChange('hover', 'scale', value)}
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
										onValueChange={(value) => handleRotateOrLiftChange('hover', 'rotate', value)}
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
										onValueChange={(value) => handleRotateOrLiftChange('hover', 'lift', value)}
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
										type="button"
										variant="outline"
										size="sm"
										className="w-full text-xs h-8"
										onClick={() => handleResetState('hover')}
										disabled={disabled}
									>
										<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
										Restaurar valores por defecto
									</Button>
								</FormRow>
							</FormSection>
						</>
					)}
				</>
			)}

			{activeTab === 'focus' && (
				<>
					<FormSection>
						<FormToggle
							id="focus"
							label="Activar estado focus"
							description="Habilita efectos especiales cuando la tarjeta tiene el foco"
							checked={states.focus}
							onCheckedChange={(checked) => handleStateChange('focus', checked)}
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
										description="Factor de escala cuando la tarjeta tiene el foco"
										value={states.focusScale}
										onValueChange={(value) => handleStatePropertyChange('focus', 'scale', value)}
										min={1}
										max={1.2}
										step={0.01}
										disabled={disabled}
									/>

									<FormSlider
										id="focusRotate"
										label="Rotación"
										description="Ángulo de rotación cuando la tarjeta tiene el foco"
										value={states.focusRotate}
										onValueChange={(value) => handleRotateOrLiftChange('focus', 'rotate', value)}
										min={-5}
										max={5}
										step={0.5}
										unit="°"
										disabled={disabled}
									/>

									<FormSlider
										id="focusTranslateY"
										label="Elevación"
										description="Desplazamiento vertical cuando la tarjeta tiene el foco"
										value={states.focusTranslateY}
										onValueChange={(value) => handleRotateOrLiftChange('focus', 'lift', value)}
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
										type="button"
										variant="outline"
										size="sm"
										className="w-full text-xs h-8"
										onClick={() => handleResetState('focus')}
										disabled={disabled}
									>
										<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
										Restaurar valores por defecto
									</Button>
								</FormRow>
							</FormSection>
						</>
					)}
				</>
			)}

			{activeTab === 'active' && (
				<>
					<FormSection>
						<FormToggle
							id="active"
							label="Activar estado active"
							description="Habilita efectos especiales cuando la tarjeta está activa"
							checked={states.active}
							onCheckedChange={(checked) => handleStateChange('active', checked)}
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
										onValueChange={(value) => handleStatePropertyChange('active', 'scale', value)}
										min={0.9}
										max={1.1}
										step={0.01}
										disabled={disabled}
									/>

									<FormSlider
										id="activeBrightness"
										label="Brillo"
										description="Factor de brillo cuando la tarjeta está activa"
										value={statesSystem.active?.brightness ?? 0.95}
										onValueChange={(value) => handleStatePropertyChange('active', 'brightness', value)}
										min={0.5}
										max={1.5}
										step={0.01}
										disabled={disabled}
									/>
								</FormGroup>
							</FormSection>

							<FormSection>
								<FormRow>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="w-full text-xs h-8"
										onClick={() => handleResetState('active')}
										disabled={disabled}
									>
										<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
										Restaurar valores por defecto
									</Button>
								</FormRow>
							</FormSection>
						</>
					)}
				</>
			)}

			{activeTab === 'selected' && (
				<>
					<FormSection>
						<FormToggle
							id="selected"
							label="Activar estado selected"
							description="Habilita efectos especiales cuando la tarjeta está seleccionada"
							checked={states.selected}
							onCheckedChange={(checked) => handleStateChange('selected', checked)}
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
										onValueChange={(value) => handleStatePropertyChange('selected', 'scale', value)}
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
										onValueChange={(value) => handleRotateOrLiftChange('selected', 'rotate', value)}
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
										onValueChange={(value) => handleRotateOrLiftChange('selected', 'lift', value)}
										min={-20}
										max={20}
										unit="px"
										disabled={disabled}
									/>

									<FormSlider
										id="selectedBrightness"
										label="Brillo"
										description="Factor de brillo cuando la tarjeta está seleccionada"
										value={statesSystem.selected?.brightness ?? 1.1}
										onValueChange={(value) => handleStatePropertyChange('selected', 'brightness', value)}
										min={0.8}
										max={1.5}
										step={0.01}
										disabled={disabled}
									/>
								</FormGroup>
							</FormSection>

							<FormSection>
								<FormRow>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="w-full text-xs h-8"
										onClick={() => handleResetState('selected')}
										disabled={disabled}
									>
										<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
										Restaurar valores por defecto
									</Button>
								</FormRow>
							</FormSection>
						</>
					)}
				</>
			)}
		</FormLayout>
	);
}
