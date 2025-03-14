'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TextureConfig } from '../../types/base-card-types';

interface TextureAdvancedOptionsProps {
	texture: TextureConfig;
	onChange: (texture: TextureConfig) => void;
}

export function TextureAdvancedOptions({ texture, onChange }: TextureAdvancedOptionsProps) {
	const handleChange = (key: keyof TextureConfig, value: TextureConfig[keyof TextureConfig]) => {
		onChange({
			...texture,
			[key]: value,
		});
	};

	return (
		<Tabs defaultValue="blend">
			<TabsList className="grid w-full grid-cols-3">
				<TabsTrigger value="blend">Mezcla</TabsTrigger>
				<TabsTrigger value="animation">Animación</TabsTrigger>
				<TabsTrigger value="effects">Efectos</TabsTrigger>
			</TabsList>

			<TabsContent value="blend" className="space-y-4">
				<div className="space-y-2">
					<Label>Modo de mezcla</Label>
					<Select value={texture.blendMode} onValueChange={(value) => handleChange('blendMode', value)}>
						<SelectTrigger>
							<SelectValue placeholder="Selecciona un modo de mezcla" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="normal">Normal</SelectItem>
							<SelectItem value="multiply">Multiplicar</SelectItem>
							<SelectItem value="screen">Pantalla</SelectItem>
							<SelectItem value="overlay">Superposición</SelectItem>
							<SelectItem value="darken">Oscurecer</SelectItem>
							<SelectItem value="lighten">Aclarar</SelectItem>
							<SelectItem value="color-dodge">Sobreexposición</SelectItem>
							<SelectItem value="color-burn">Subexposición</SelectItem>
							<SelectItem value="hard-light">Luz fuerte</SelectItem>
							<SelectItem value="soft-light">Luz suave</SelectItem>
							<SelectItem value="difference">Diferencia</SelectItem>
							<SelectItem value="exclusion">Exclusión</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Intensidad de mezcla</Label>
					<Slider
						value={[texture.blendIntensity || 1]}
						onValueChange={([value]) => handleChange('blendIntensity', value)}
						min={0}
						max={1}
						step={0.1}
					/>
				</div>
			</TabsContent>

			<TabsContent value="animation" className="space-y-4">
				<div className="flex items-center space-x-2">
					<Switch checked={texture.animated} onCheckedChange={(checked) => handleChange('animated', checked)} />
					<Label>Animación activada</Label>
				</div>

				{texture.animated && (
					<>
						<div className="space-y-2">
							<Label>Velocidad de animación</Label>
							<Slider
								value={[texture.animationSpeed || 1]}
								onValueChange={([value]) => handleChange('animationSpeed', value)}
								min={0.1}
								max={3}
								step={0.1}
							/>
						</div>

						<div className="space-y-2">
							<Label>Tipo de animación</Label>
							<Select value={texture.animationType} onValueChange={(value) => handleChange('animationType', value)}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un tipo de animación" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="rotate">Rotación</SelectItem>
									<SelectItem value="pulse">Pulso</SelectItem>
									<SelectItem value="wave">Onda</SelectItem>
									<SelectItem value="flow">Flujo</SelectItem>
									<SelectItem value="bounce">Rebote</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</>
				)}
			</TabsContent>

			<TabsContent value="effects" className="space-y-4">
				{texture.patternType === 'noise' && (
					<>
						<div className="space-y-2">
							<Label>Tipo de ruido</Label>
							<Select value={texture.noiseType} onValueChange={(value) => handleChange('noiseType', value)}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un tipo de ruido" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="perlin">Perlin</SelectItem>
									<SelectItem value="simplex">Simplex</SelectItem>
									<SelectItem value="fractal">Fractal</SelectItem>
									<SelectItem value="cellular">Celular</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Octavas</Label>
							<Slider
								value={[texture.octaves || 3]}
								onValueChange={([value]) => handleChange('octaves', value)}
								min={1}
								max={8}
								step={1}
							/>
						</div>
					</>
				)}

				<div className="space-y-2">
					<Label>Desenfoque</Label>
					<Slider
						value={[texture.blur || 0]}
						onValueChange={([value]) => handleChange('blur', value)}
						min={0}
						max={20}
						step={1}
					/>
				</div>

				<div className="space-y-2">
					<Label>Distorsión</Label>
					<Slider
						value={[texture.distortion || 0]}
						onValueChange={([value]) => handleChange('distortion', value)}
						min={0}
						max={1}
						step={0.1}
					/>
				</div>
			</TabsContent>
		</Tabs>
	);
}
