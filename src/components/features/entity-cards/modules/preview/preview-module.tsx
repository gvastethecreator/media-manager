'use client';

import {
	FormGroup,
	FormInput,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
} from '@/components/features/entity-cards/settings/panels/shared';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Eye, Info, LayoutGrid, Maximize2, RotateCw, ZoomIn } from 'lucide-react';
import type { PreviewModuleProps } from './types';
import { usePreview } from './use-preview';

/**
 * Componente principal del módulo de previsualización
 */
export function PreviewModule({ initialOptions = {}, onChange, disabled = false, className }: PreviewModuleProps) {
	// Utilizamos el hook para gestionar la previsualización
	const { options, sizeOptions, updateOption } = usePreview({
		initialOptions,
		onChange,
		disabled,
	});

	// Determinar si se deben mostrar los campos de dimensiones personalizadas
	const showCustomDimensions = options.size === 'custom';

	return (
		<Card className={cn('w-full bg-slate-50/20 border-slate-200/50', className)}>
			<FormLayout title="Vista Previa" description="Configura la visualización de la tarjeta en modo vista previa">
				<FormSection title="Tamaño">
					<FormGroup>
						<FormSelect
							id="preview-size"
							label="Tamaño de Vista Previa"
							description="Selecciona el tamaño de las tarjetas en la vista previa"
							value={options.size}
							onValueChange={(value: string) => updateOption('size', value)}
							options={sizeOptions}
							disabled={disabled}
							icon={<Maximize2 className="h-4 w-4" />}
						/>
					</FormGroup>

					{showCustomDimensions && (
						<FormGroup>
							<FormRow>
								<FormInput
									id="custom-width"
									label="Ancho personalizado"
									type="number"
									value={options.customWidth?.toString() || '300'}
									onChange={(value: string) => updateOption('customWidth', Number.parseInt(value, 10))}
									disabled={disabled}
								/>
								<FormInput
									id="custom-height"
									label="Alto personalizado"
									type="number"
									value={options.customHeight?.toString() || '400'}
									onChange={(value: string) => updateOption('customHeight', Number.parseInt(value, 10))}
									disabled={disabled}
								/>
							</FormRow>
						</FormGroup>
					)}
				</FormSection>

				<FormSection title="Visualización">
					<FormGroup>
						<FormToggle
							id="show-controls"
							label="Mostrar Controles"
							description="Muestra los controles de navegación en la vista previa"
							checked={options.showControls}
							onCheckedChange={(checked: boolean) => updateOption('showControls', checked)}
							disabled={disabled}
							icon={<LayoutGrid className="h-4 w-4" />}
						/>

						<FormToggle
							id="show-info"
							label="Mostrar Información"
							description="Muestra información adicional sobre la tarjeta"
							checked={options.showInfo}
							onCheckedChange={(checked: boolean) => updateOption('showInfo', checked)}
							disabled={disabled}
							icon={<Info className="h-4 w-4" />}
						/>
					</FormGroup>

					<FormGroup>
						<FormToggle
							id="show-border"
							label="Mostrar Borde"
							description="Muestra un borde alrededor de la tarjeta"
							checked={options.showBorder}
							onCheckedChange={(checked: boolean) => updateOption('showBorder', checked)}
							disabled={disabled}
						/>
					</FormGroup>
				</FormSection>

				<FormSection title="Interacción">
					<FormGroup>
						<FormToggle
							id="enable-interaction"
							label="Habilitar Interacción"
							description="Permite interactuar con la tarjeta en la vista previa"
							checked={options.enableInteraction}
							onCheckedChange={(checked: boolean) => updateOption('enableInteraction', checked)}
							disabled={disabled}
							icon={<Eye className="h-4 w-4" />}
						/>

						<FormToggle
							id="auto-rotate"
							label="Rotación Automática"
							description="Rota automáticamente la tarjeta en la vista previa"
							checked={options.autoRotate}
							onCheckedChange={(checked: boolean) => updateOption('autoRotate', checked)}
							disabled={disabled}
							icon={<RotateCw className="h-4 w-4" />}
						/>
					</FormGroup>

					{options.autoRotate && (
						<FormGroup>
							<FormSlider
								id="rotation-speed"
								label="Velocidad de Rotación"
								description="Ajusta la velocidad de rotación automática"
								value={options.rotationSpeed || 1}
								onValueChange={(value: number) => updateOption('rotationSpeed', value)}
								min={0.5}
								max={5}
								step={0.5}
								disabled={disabled}
							/>
						</FormGroup>
					)}

					<FormGroup>
						<FormSlider
							id="zoom-level"
							label="Nivel de Zoom"
							description="Ajusta el nivel de zoom inicial"
							value={options.zoomLevel || 1}
							onValueChange={(value: number) => updateOption('zoomLevel', value)}
							min={0.5}
							max={2}
							step={0.1}
							disabled={disabled}
							icon={<ZoomIn className="h-4 w-4" />}
						/>
					</FormGroup>
				</FormSection>
			</FormLayout>
		</Card>
	);
}
