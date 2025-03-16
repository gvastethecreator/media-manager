'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AlertCircle, Box } from 'lucide-react';
import { useState } from 'react';
import { DesignPanelProps, DesignSystem, DesignSystemPreset } from './types';

// Presets de relación de aspecto
const aspectRatioOptions = [
	{ value: '1/1', label: 'Cuadrado (1:1)' },
	{ value: '7/10', label: 'Tarjeta (7:10)' },
	{ value: '16/9', label: 'Panorámico (16:9)' },
	{ value: '4/3', label: 'Clásico (4:3)' },
	{ value: '9/16', label: 'Móvil (9:16)' },
	{ value: '3/2', label: 'Fotografía (3:2)' },
];

// Presets de diseño
const designPresets: DesignSystemPreset[] = [
	{
		id: 'modern',
		name: 'Moderno',
		description: 'Diseño limpio y minimalista con bordes redondeados',
		designSystem: {
			// Propiedades base requeridas
			borderRadius: 12,
			padding: 16,
			aspectRatio: '7/10',
			maxWidth: 400,
			elevation: 2,
			shadowColor: 'rgba(0, 0, 0, 0.25)',
			backgroundColor: 'transparent',
			backgroundOpacity: 1,
			backdropFilter: 'none',
			backdropBlurAmount: 0,
			borderWidth: 1,
			borderStyle: 'solid',
			borderColor: 'rgba(255,255,255,0.1)',
			customCssClasses: [],
			customCssVariables: {},

			// Propiedades adicionales
			preset: 'modern',
			variant: 'default',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			shadowStyle: 'soft',
			fontFamily: 'system-ui',
			colorScheme: 'auto',
		},
	},
	{
		id: 'classic',
		name: 'Clásico',
		description: 'Diseño tradicional con bordes definidos',
		designSystem: {
			// Propiedades base requeridas
			borderRadius: 0,
			padding: 16,
			aspectRatio: '7/10',
			maxWidth: 400,
			elevation: 1,
			shadowColor: 'rgba(0, 0, 0, 0.25)',
			backgroundColor: 'transparent',
			backgroundOpacity: 1,
			backdropFilter: 'none',
			backdropBlurAmount: 0,
			borderWidth: 2,
			borderStyle: 'solid',
			borderColor: 'rgba(0,0,0,0.2)',
			customCssClasses: [],
			customCssVariables: {},

			// Propiedades adicionales
			preset: 'classic',
			variant: 'default',
			cornerStyle: 'sharp',
			cornerRadius: 0,
			shadowStyle: 'hard',
			fontFamily: 'serif',
			colorScheme: 'light',
		},
	},
	{
		id: 'minimalist',
		name: 'Minimalista',
		description: 'Diseño ultra simple y ligero',
		designSystem: {
			// Propiedades base requeridas
			borderRadius: 16,
			padding: 16,
			aspectRatio: '1/1',
			maxWidth: 400,
			elevation: 0,
			shadowColor: 'rgba(0, 0, 0, 0)',
			backgroundColor: 'transparent',
			backgroundOpacity: 1,
			backdropFilter: 'none',
			backdropBlurAmount: 0,
			borderWidth: 0,
			borderStyle: 'none',
			borderColor: 'transparent',
			customCssClasses: [],
			customCssVariables: {},

			// Propiedades adicionales
			preset: 'minimalist',
			variant: 'default',
			cornerStyle: 'rounded',
			cornerRadius: 16,
			shadowStyle: 'none',
			fontFamily: 'system-ui',
			colorScheme: 'auto',
		},
	},
	{
		id: 'retro',
		name: 'Retro',
		description: 'Diseño con estética vintage',
		designSystem: {
			// Propiedades base requeridas
			borderRadius: 0,
			padding: 16,
			aspectRatio: '4/3',
			maxWidth: 400,
			elevation: 3,
			shadowColor: 'rgba(0, 0, 0, 0.5)',
			backgroundColor: '#f5f5dc',
			backgroundOpacity: 1,
			backdropFilter: 'none',
			backdropBlurAmount: 0,
			borderWidth: 3,
			borderStyle: 'solid',
			borderColor: '#8b4513',
			customCssClasses: [],
			customCssVariables: {},

			// Propiedades adicionales
			preset: 'retro',
			variant: 'default',
			cornerStyle: 'sharp',
			cornerRadius: 0,
			shadowStyle: 'hard',
			fontFamily: 'monospace',
			colorScheme: 'light',
		},
	},
];

export function DesignPanel({ designSystem, onChange, disabled = false, className }: DesignPanelProps) {
	const [activeTab, setActiveTab] = useState('general');
	const [customCssKey, setCustomCssKey] = useState<string>('');
	const [customCssValue, setCustomCssValue] = useState<string>('');

	// Función para seleccionar un preset completo
	const selectPreset = (presetId: string) => {
		const preset = designPresets.find((p) => p.id === presetId);
		if (preset) {
			onChange({
				...preset.designSystem,
				// Mantenemos las clases y variables CSS personalizadas
				customCssClasses: designSystem.customCssClasses || [],
				customCssVariables: designSystem.customCssVariables || {},
			});
		}
	};

	// Función para actualizar un campo específico
	const updateField = <K extends keyof DesignSystem>(field: K, value: DesignSystem[K]) => {
		onChange({ ...designSystem, [field]: value });
	};

	// Manejador para restablecer a los valores predeterminados
	const handleReset = () => {
		// Aquí podríamos importar DEFAULT_DESIGN_SYSTEM, pero para simplificar
		// solo restablecemos algunas propiedades comunes
		onChange({
			...designSystem,
			borderRadius: 12,
			padding: 16,
			aspectRatio: '1/1',
			elevation: 3,
			backgroundColor: '#ffffff',
			backgroundOpacity: 1,
			borderWidth: 1,
			borderStyle: 'solid',
			borderColor: 'rgba(0, 0, 0, 0.1)',
		});
	};

	// Agregar una variable CSS personalizada
	const handleAddCustomCssVariable = () => {
		if (!customCssKey || !customCssValue) return;

		const newCustomCssVariables = {
			...designSystem.customCssVariables,
			[customCssKey]: customCssValue,
		};

		onChange({
			...designSystem,
			customCssVariables: newCustomCssVariables,
		});

		setCustomCssKey('');
		setCustomCssValue('');
	};

	// Eliminar una variable CSS personalizada
	const handleRemoveCustomCssVariable = (key: string) => {
		const newCustomCssVariables = { ...designSystem.customCssVariables };
		delete newCustomCssVariables[key];

		onChange({
			...designSystem,
			customCssVariables: newCustomCssVariables,
		});
	};

	// Agregar una clase CSS personalizada
	const handleAddCustomClass = (className: string) => {
		if (!className || designSystem.customCssClasses?.includes(className)) return;

		onChange({
			...designSystem,
			customCssClasses: [...(designSystem.customCssClasses || []), className],
		});
	};

	// Eliminar una clase CSS personalizada
	const handleRemoveCustomClass = (className: string) => {
		onChange({
			...designSystem,
			customCssClasses: (designSystem.customCssClasses || []).filter((c) => c !== className),
		});
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium flex items-center">
					<Box className="h-4 w-4 mr-2 text-muted-foreground" />
					Configuración de Diseño
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
					<TabsList className="grid grid-cols-4 mb-4">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="background">Fondo</TabsTrigger>
						<TabsTrigger value="borders">Bordes</TabsTrigger>
						<TabsTrigger value="advanced">Avanzado</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Preset de Diseño</Label>
								<Select
									value={designSystem.preset || 'modern'}
									onValueChange={(value) => selectPreset(value)}
									disabled={disabled}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar preset" />
									</SelectTrigger>
									<SelectContent>
										{designPresets.map((preset) => (
											<SelectItem key={preset.id} value={preset.id}>
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{
															backgroundColor: preset.designSystem.accentColor || preset.designSystem.borderColor,
														}}
													/>
													<span>{preset.name}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground mt-1">Elige un estilo predefinido para la tarjeta</p>
							</div>

							<div className="space-y-2">
								<Label>Relación de Aspecto</Label>
								<Select
									value={designSystem.aspectRatio || '7/10'}
									onValueChange={(value) => updateField('aspectRatio', value)}
									disabled={disabled}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar relación" />
									</SelectTrigger>
									<SelectContent>
										{aspectRatioOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground mt-1">Controla la proporción de ancho y alto</p>
							</div>

							<div className="space-y-2">
								<Label>Estilo de Esquinas</Label>
								<RadioGroup
									value={designSystem.cornerStyle || 'rounded'}
									onValueChange={(value) => updateField('cornerStyle', value)}
									className="flex gap-4"
									disabled={disabled}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="rounded" id="corner-rounded" />
										<Label htmlFor="corner-rounded" className="cursor-pointer">
											Redondeadas
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="sharp" id="corner-sharp" />
										<Label htmlFor="corner-sharp" className="cursor-pointer">
											Rectas
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="custom" id="corner-custom" />
										<Label htmlFor="corner-custom" className="cursor-pointer">
											Personalizado
										</Label>
									</div>
								</RadioGroup>
							</div>

							{designSystem.cornerStyle === 'rounded' || designSystem.cornerStyle === 'custom' ? (
								<div className="space-y-2">
									<div className="flex justify-between">
										<Label>Radio de Esquina</Label>
										<span className="text-xs">{designSystem.cornerRadius || 12}px</span>
									</div>
									<Slider
										value={[designSystem.cornerRadius || 12]}
										min={0}
										max={32}
										step={1}
										onValueChange={([value]) => updateField('cornerRadius', value)}
										disabled={disabled}
									/>
								</div>
							) : null}

							<div className="space-y-2">
								<div className="flex justify-between">
									<Label>Elevación</Label>
									<span className="text-xs">{designSystem.elevation || 2}</span>
								</div>
								<Slider
									value={[designSystem.elevation || 2]}
									min={0}
									max={5}
									step={1}
									onValueChange={([value]) => updateField('elevation', value)}
									disabled={disabled}
								/>
								<p className="text-xs text-muted-foreground mt-1">Controla la altura percibida de la tarjeta</p>
							</div>

							<div className="space-y-2">
								<Label>Estilo de Sombra</Label>
								<Select
									value={designSystem.shadowStyle || 'soft'}
									onValueChange={(value) => updateField('shadowStyle', value)}
									disabled={disabled}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar estilo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="soft">Suave</SelectItem>
										<SelectItem value="hard">Definida</SelectItem>
										<SelectItem value="none">Sin sombra</SelectItem>
										<SelectItem value="custom">Personalizada</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="background" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Color de Fondo</Label>
								<div className="flex gap-2">
									<Input
										type="color"
										value={designSystem.backgroundColor || '#ffffff'}
										onChange={(e) => updateField('backgroundColor', e.target.value)}
										className="w-10 h-10 p-1"
										disabled={disabled}
									/>
									<Input
										type="text"
										value={designSystem.backgroundColor || 'transparent'}
										onChange={(e) => updateField('backgroundColor', e.target.value)}
										className="flex-1"
										placeholder="transparent, #fff, rgba(255,255,255,0.5)..."
										disabled={disabled}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Estilo de Borde</Label>
								<Select
									value={designSystem.borderStyle || 'solid'}
									onValueChange={(value) => updateField('borderStyle', value)}
									disabled={disabled}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar estilo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="solid">Sólido</SelectItem>
										<SelectItem value="dashed">Discontinuo</SelectItem>
										<SelectItem value="dotted">Punteado</SelectItem>
										<SelectItem value="none">Sin borde</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{designSystem.borderStyle !== 'none' && (
								<>
									<div className="space-y-2">
										<div className="flex justify-between">
											<Label>Ancho de Borde</Label>
											<span className="text-xs">{designSystem.borderWidth || 1}px</span>
										</div>
										<Slider
											value={[designSystem.borderWidth || 1]}
											min={0}
											max={10}
											step={1}
											onValueChange={([value]) => updateField('borderWidth', value)}
											disabled={disabled}
										/>
									</div>

									<div className="space-y-2">
										<Label>Color de Borde</Label>
										<div className="flex gap-2">
											<Input
												type="color"
												value={designSystem.borderColor || '#ffffff'}
												onChange={(e) => updateField('borderColor', e.target.value)}
												className="w-10 h-10 p-1"
												disabled={disabled}
											/>
											<Input
												type="text"
												value={designSystem.borderColor || 'rgba(255,255,255,0.1)'}
												onChange={(e) => updateField('borderColor', e.target.value)}
												className="flex-1"
												placeholder="#fff, rgba(255,255,255,0.5)..."
												disabled={disabled}
											/>
										</div>
									</div>
								</>
							)}

							<div className="space-y-2">
								<Label>Esquema de Color</Label>
								<Select
									value={designSystem.colorScheme || 'auto'}
									onValueChange={(value) => updateField('colorScheme', value)}
									disabled={disabled}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar esquema" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="auto">Automático</SelectItem>
										<SelectItem value="light">Claro</SelectItem>
										<SelectItem value="dark">Oscuro</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground mt-1">
									Determina cómo se ajustan los colores según el tema del sistema
								</p>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="borders" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Estilo de Borde</Label>
								<Select
									value={designSystem.borderStyle || 'solid'}
									onValueChange={(value) => updateField('borderStyle', value)}
									disabled={disabled}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar estilo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Ninguno</SelectItem>
										<SelectItem value="solid">Sólido</SelectItem>
										<SelectItem value="dashed">Discontinuo</SelectItem>
										<SelectItem value="dotted">Punteado</SelectItem>
										<SelectItem value="double">Doble</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Color de Borde</Label>
								<ColorPicker
									value={designSystem.borderColor || '#ffffff'}
									onChange={(value) => updateField('borderColor', value)}
									disabled={disabled}
								/>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="advanced" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Clases CSS Personalizadas</Label>
								<Input
									placeholder="clase1 clase2 clase3"
									value={designSystem.customCssClasses?.join(' ') || ''}
									onChange={(e) => updateField('customCssClasses', e.target.value.split(' ').filter(Boolean))}
									disabled={disabled}
								/>
								<p className="text-xs text-muted-foreground">Separadas por espacios</p>
							</div>

							<div className="space-y-2">
								<Label>Variables CSS Personalizadas</Label>
								<Alert variant="info" className="py-2 mb-2">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle className="text-xs">Personalización avanzada</AlertTitle>
									<AlertDescription className="text-xs">
										Estas variables están disponibles en el CSS como variables personalizadas (--nombre-variable).
									</AlertDescription>
								</Alert>

								<div className="grid grid-cols-2 gap-2 mb-2">
									<Input
										placeholder="Nombre (sin --)"
										value={customCssKey}
										onChange={(e) => setCustomCssKey(e.target.value)}
									/>
									<Input
										placeholder="Valor"
										value={customCssValue}
										onChange={(e) => setCustomCssValue(e.target.value)}
									/>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="w-full mb-4"
									onClick={handleAddCustomCssVariable}
									disabled={!customCssKey || !customCssValue}
								>
									Agregar variable CSS
								</Button>

								{Object.keys(designSystem.customCssVariables || {}).length > 0 ? (
									<div className="space-y-2 mt-2">
										{Object.entries(designSystem.customCssVariables || {}).map(([key, value]) => (
											<div key={key} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
												<div>
													<span className="text-sm font-mono">--{key}:</span>{' '}
													<span className="text-sm text-muted-foreground">{value}</span>
												</div>
												<Button variant="ghost" size="sm" onClick={() => handleRemoveCustomCssVariable(key)}>
													×
												</Button>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">No hay variables CSS personalizadas.</p>
								)}
							</div>
						</div>
					</TabsContent>
				</Tabs>

				<div className="mt-6 flex justify-end">
					<Button variant="outline" onClick={handleReset} disabled={disabled}>
						Restablecer
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
