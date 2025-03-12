'use client';

import type { CardOptions } from '@/components/features/entity-cards/base/base-card-types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as React from 'react';

interface CardConfigManagerProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
	onClose?: () => void;
}

export function CardConfigManager({ options, onOptionsChange, onClose }: CardConfigManagerProps) {
	// Estado local para controlar los valores de opciones antes de aplicarlos
	const [localOptions, setLocalOptions] = React.useState<CardOptions>(options);

	// Función para actualizar una opción específica
	const updateOption = React.useCallback(<K extends keyof CardOptions>(key: K, value: CardOptions[K]) => {
		setLocalOptions((prev) => ({
			...prev,
			[key]: value,
		}));
	}, []);

	// Manejador especial para compatibilidad con nombres duplicados
	const handleScanLinesChange = (checked: boolean) => {
		setLocalOptions((prev) => ({
			...prev,
			enableScanlines: checked,
			enableScanlinesEffect: checked, // Mantener sincronizado para compatibilidad
		}));
	};

	// Aplicar cambios al componente padre
	const applyChanges = () => {
		onOptionsChange(localOptions);
	};

	// Asegurarnos de que los valores sean válidos y tengan defaults
	React.useEffect(() => {
		// Establecer valores por defecto para MaxRotation si no está definido
		if (localOptions.maxRotation === undefined) {
			updateOption('maxRotation', 15);
		}

		// Asegurar que hoverLiftHeight tenga un valor por defecto
		if (localOptions.hoverLiftHeight === undefined) {
			updateOption('hoverLiftHeight', 5);
		}

		// Inicializar sistema de rareza si no existe
		if (localOptions.raritySystem === undefined) {
			updateOption('raritySystem', {
				enabled: true,
				defaultRarity: 'common',
				rarities: {},
			});
		}
	}, [localOptions.maxRotation, localOptions.hoverLiftHeight, localOptions.raritySystem, updateOption]);

	return (
		<div className="w-full space-y-4">
			<Tabs defaultValue="effects" className="w-full">
				<TabsList className="grid grid-cols-2 mb-4">
					<TabsTrigger value="effects">Efectos</TabsTrigger>
					<TabsTrigger value="colors">Colores</TabsTrigger>
				</TabsList>

				<TabsContent value="effects" className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="enable3DEffect"
									checked={localOptions.enable3DEffect}
									onCheckedChange={(checked) => updateOption('enable3DEffect', checked === true)}
								/>
								<Label htmlFor="enable3DEffect">Efecto 3D</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="enableHolographicEffect"
									checked={localOptions.enableHolographicEffect}
									onCheckedChange={(checked) => updateOption('enableHolographicEffect', checked === true)}
								/>
								<Label htmlFor="enableHolographicEffect">Efecto Holográfico</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="enableScanlines"
									checked={localOptions.enableScanlines || localOptions.enableScanlinesEffect}
									onCheckedChange={(checked) => handleScanLinesChange(checked === true)}
								/>
								<Label htmlFor="enableScanlines">Líneas de Escaneo</Label>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="enableBorderEffect"
									checked={localOptions.enableBorderEffect}
									onCheckedChange={(checked) => updateOption('enableBorderEffect', checked === true)}
								/>
								<Label htmlFor="enableBorderEffect">Borde Personalizado</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="enableAnimatedBorder"
									checked={localOptions.enableAnimatedBorder}
									onCheckedChange={(checked) => updateOption('enableAnimatedBorder', checked === true)}
								/>
								<Label htmlFor="enableAnimatedBorder">Borde Animado</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="enableGlowEffect"
									checked={localOptions.enableGlowEffect}
									onCheckedChange={(checked) => updateOption('enableGlowEffect', checked === true)}
								/>
								<Label htmlFor="enableGlowEffect">Efecto Resplandor</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="enableGrainEffect"
									checked={localOptions.enableGrainEffect}
									onCheckedChange={(checked) => updateOption('enableGrainEffect', checked === true)}
								/>
								<Label htmlFor="enableGrainEffect">Efecto Grano</Label>
							</div>
						</div>
					</div>

					{/* Controles de intensidad */}
					<div className="space-y-4 pt-2">
						<div className="space-y-2">
							<Label htmlFor="hoverLiftHeight">Altura de Levitación</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="hoverLiftHeight"
									value={[localOptions.hoverLiftHeight ?? 5]}
									min={0}
									max={20}
									step={1}
									onValueChange={(value) => updateOption('hoverLiftHeight', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">{localOptions.hoverLiftHeight ?? 5}px</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="maxRotation">Rotación Máxima</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="maxRotation"
									value={[localOptions.maxRotation ?? 15]}
									min={0}
									max={30}
									step={1}
									onValueChange={(value) => updateOption('maxRotation', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">{localOptions.maxRotation ?? 15}°</span>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="colors" className="space-y-4">
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-2">
							<Label htmlFor="primaryColor">Color Primario</Label>
							<div className="flex gap-2">
								<Input
									id="primaryColor"
									value={localOptions.primaryColor}
									onChange={(e) => updateOption('primaryColor', e.target.value)}
									placeholder="ej. 255, 0, 128"
								/>
								<div
									className="w-10 h-10 rounded border"
									style={{
										backgroundColor: `rgba(${localOptions.primaryColor}, 1)`,
									}}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="secondaryColor">Color Secundario</Label>
							<div className="flex gap-2">
								<Input
									id="secondaryColor"
									value={localOptions.secondaryColor}
									onChange={(e) => updateOption('secondaryColor', e.target.value)}
									placeholder="ej. 0, 128, 255"
								/>
								<div
									className="w-10 h-10 rounded border"
									style={{
										backgroundColor: `rgba(${localOptions.secondaryColor}, 1)`,
									}}
								/>
							</div>
						</div>
					</div>

					<div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
						<p>Los colores deben ingresarse en formato RGB separados por comas.</p>
						<p>
							Ejemplo: <span className="font-mono">255, 0, 128</span>
						</p>
					</div>
				</TabsContent>
			</Tabs>

			<div className="flex justify-end gap-2 mt-6">
				{onClose && (
					<Button variant="outline" onClick={onClose}>
						Cancelar
					</Button>
				)}
				<Button onClick={applyChanges}>Aplicar Cambios</Button>
			</div>
		</div>
	);
}
