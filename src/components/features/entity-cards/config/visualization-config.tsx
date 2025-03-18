'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { useState } from 'react';
import type { CardOptions } from '../types/shared-card-types';

export interface VisualizationConfigProps {
	options: Partial<CardOptions>;
	onOptionsChange: (options: Partial<CardOptions>) => void;
	onClose: () => void;
	entityId?: string;
	entityType?: string;
}

/**
 * Componente para configurar las opciones visuales de una tarjeta
 * 🎨 Permite personalizar efectos visuales y diseño
 */
export function VisualizationConfig({
	options,
	onOptionsChange,
	onClose,
	entityId,
	entityType,
}: VisualizationConfigProps) {
	const [activeTab, setActiveTab] = useState('general');

	const handleChange = (key: string, value: any) => {
		onOptionsChange({
			...options,
			[key]: value,
		});
	};

	return (
		<div className="visualization-config bg-background border rounded-lg shadow-lg p-6 max-w-xl w-full">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-bold">Configuración Visual</h2>
				<Button variant="ghost" size="icon" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid grid-cols-4 w-full mb-4">
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="effects">Efectos</TabsTrigger>
					<TabsTrigger value="layouts">Diseño</TabsTrigger>
					<TabsTrigger value="advanced">Avanzado</TabsTrigger>
				</TabsList>

				<TabsContent value="general" className="space-y-4">
					<h3 className="text-sm font-semibold mb-2">Efectos principales</h3>

					<div className="flex flex-col gap-2">
						{/* Checkboxes para efectos principales */}
						<div className="flex items-center">
							<input
								type="checkbox"
								id="enable3DEffect"
								checked={options.enable3DEffect || false}
								onChange={(e) => handleChange('enable3DEffect', e.target.checked)}
								className="mr-2"
							/>
							<label htmlFor="enable3DEffect">Efecto 3D</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								id="enableHolographicEffect"
								checked={options.enableHolographicEffect || false}
								onChange={(e) => handleChange('enableHolographicEffect', e.target.checked)}
								className="mr-2"
							/>
							<label htmlFor="enableHolographicEffect">Efecto Holográfico</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								id="enableGlowEffect"
								checked={options.enableGlowEffect || false}
								onChange={(e) => handleChange('enableGlowEffect', e.target.checked)}
								className="mr-2"
							/>
							<label htmlFor="enableGlowEffect">Efecto Brillo</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								id="enableBorderEffect"
								checked={options.enableBorderEffect || false}
								onChange={(e) => handleChange('enableBorderEffect', e.target.checked)}
								className="mr-2"
							/>
							<label htmlFor="enableBorderEffect">Efecto Borde</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								id="enableGrainEffect"
								checked={options.enableGrainEffect || false}
								onChange={(e) => handleChange('enableGrainEffect', e.target.checked)}
								className="mr-2"
							/>
							<label htmlFor="enableGrainEffect">Efecto Grano</label>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								id="enableScanlinesEffect"
								checked={options.enableScanlinesEffect || false}
								onChange={(e) => handleChange('enableScanlinesEffect', e.target.checked)}
								className="mr-2"
							/>
							<label htmlFor="enableScanlinesEffect">Efecto Scanlines</label>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="effects" className="space-y-4">
					<h3 className="text-sm font-semibold mb-2">Configuración de Efectos</h3>

					{/* Configuración de brillo */}
					{options.enableGlowEffect && (
						<div className="space-y-2">
							<h4 className="text-xs uppercase tracking-wide text-muted-foreground">Brillo</h4>

							<div className="grid grid-cols-2 gap-2">
								<label className="text-xs">Intensidad</label>
								<input
									type="range"
									min="0"
									max="1"
									step="0.1"
									value={options.glowOptions?.intensity || 0.5}
									onChange={(e) =>
										handleChange('glowOptions', {
											...options.glowOptions,
											intensity: Number.parseFloat(e.target.value),
										})
									}
									className="w-full"
								/>

								<label className="text-xs">Tamaño</label>
								<input
									type="range"
									min="0"
									max="30"
									step="1"
									value={options.glowOptions?.size || 15}
									onChange={(e) =>
										handleChange('glowOptions', {
											...options.glowOptions,
											size: Number.parseFloat(e.target.value),
										})
									}
									className="w-full"
								/>
							</div>
						</div>
					)}

					{/* Configuración de holográfico */}
					{options.enableHolographicEffect && (
						<div className="space-y-2">
							<h4 className="text-xs uppercase tracking-wide text-muted-foreground">Holográfico</h4>

							<div className="grid grid-cols-2 gap-2">
								<label className="text-xs">Intensidad</label>
								<input
									type="range"
									min="0"
									max="1"
									step="0.1"
									value={options.holographicOptions?.intensity || 0.5}
									onChange={(e) =>
										handleChange('holographicOptions', {
											...options.holographicOptions,
											intensity: Number.parseFloat(e.target.value),
										})
									}
									className="w-full"
								/>

								<label className="text-xs">Velocidad de Animación</label>
								<input
									type="range"
									min="0"
									max="2"
									step="0.1"
									value={options.holographicOptions?.animationSpeed || 1}
									onChange={(e) =>
										handleChange('holographicOptions', {
											...options.holographicOptions,
											animationSpeed: Number.parseFloat(e.target.value),
										})
									}
									className="w-full"
								/>
							</div>
						</div>
					)}
				</TabsContent>

				<TabsContent value="layouts" className="space-y-4">
					<h3 className="text-sm font-semibold mb-2">Opciones de Diseño</h3>

					{/* Sistema de diseño */}
					<div className="space-y-2">
						<h4 className="text-xs uppercase tracking-wide text-muted-foreground">Sistema de Diseño</h4>

						<div className="grid grid-cols-2 gap-2">
							<label className="text-xs">Preset</label>
							<select
								value={options.designSystem?.preset || 'default'}
								onChange={(e) =>
									handleChange('designSystem', {
										...options.designSystem,
										preset: e.target.value,
									})
								}
								className="p-1 text-xs rounded border"
							>
								<option value="default">Por defecto</option>
								<option value="minimal">Minimalista</option>
								<option value="folder">Carpeta</option>
								<option value="album">Álbum</option>
								<option value="character">Personaje</option>
								<option value="place">Lugar</option>
								<option value="tag">Etiqueta</option>
								<option value="worldItem">Objeto</option>
								<option value="concept">Concepto</option>
							</select>

							<label className="text-xs">Relación de Aspecto</label>
							<select
								value={options.designSystem?.aspectRatio || '7/10'}
								onChange={(e) =>
									handleChange('designSystem', {
										...options.designSystem,
										aspectRatio: e.target.value,
									})
								}
								className="p-1 text-xs rounded border"
							>
								<option value="7/10">7:10 (Carta)</option>
								<option value="1/1">1:1 (Cuadrado)</option>
								<option value="16/9">16:9 (Apaisado)</option>
								<option value="4/5">4:5 (Polaroid)</option>
							</select>

							<label className="text-xs">Estilo de Esquinas</label>
							<select
								value={options.designSystem?.cornerStyle || 'rounded'}
								onChange={(e) =>
									handleChange('designSystem', {
										...options.designSystem,
										cornerStyle: e.target.value,
									})
								}
								className="p-1 text-xs rounded border"
							>
								<option value="rounded">Redondeadas</option>
								<option value="sharp">Puntiagudas</option>
								<option value="beveled">Biseladas</option>
							</select>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="advanced" className="space-y-4">
					<h3 className="text-sm font-semibold mb-2">Opciones Avanzadas</h3>

					{/* Grid de imágenes */}
					<div className="space-y-2">
						<h4 className="text-xs uppercase tracking-wide text-muted-foreground">Grid de Imágenes</h4>

						<div className="flex items-center mb-2">
							<input
								type="checkbox"
								id="useImageGrid"
								checked={options.useImageGrid || false}
								onChange={(e) => handleChange('useImageGrid', e.target.checked)}
								className="mr-2"
							/>
							<label htmlFor="useImageGrid" className="text-xs">
								Usar Grid de Imágenes
							</label>
						</div>

						{options.useImageGrid && (
							<div className="grid grid-cols-2 gap-2">
								<label className="text-xs">Diseño</label>
								<select
									value={options.imageGridLayout || 'single'}
									onChange={(e) => handleChange('imageGridLayout', e.target.value)}
									className="p-1 text-xs rounded border"
								>
									<option value="single">Individual</option>
									<option value="grid">Cuadrícula</option>
									<option value="masonry">Mosaico</option>
									<option value="carousel">Carrusel</option>
								</select>

								<label className="text-xs">Estilo</label>
								<select
									value={options.imageGridStyle || 'standard'}
									onChange={(e) => handleChange('imageGridStyle', e.target.value)}
									className="p-1 text-xs rounded border"
								>
									<option value="standard">Estándar</option>
									<option value="polaroid">Polaroid</option>
									<option value="framed">Enmarcado</option>
									<option value="minimal">Minimalista</option>
								</select>

								<label className="text-xs">Espacio entre imágenes</label>
								<input
									type="range"
									min="0"
									max="10"
									step="1"
									value={options.imageGridGap || 4}
									onChange={(e) => handleChange('imageGridGap', Number.parseInt(e.target.value))}
									className="w-full"
								/>
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>

			<div className="mt-4 pt-4 border-t flex justify-end gap-2">
				<Button variant="outline" onClick={onClose}>
					Cerrar
				</Button>
				<Button
					onClick={() => {
						// Guardar configuración (podría integrarse con guardado en base de datos)
						onClose();
					}}
				>
					Guardar
				</Button>
			</div>
		</div>
	);
}
