'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { SettingsSection } from '../../components/settings-section';
import { ZoneSelector } from '../../components/zone-selector';
import type { NoiseConfig } from '../noise-schema';

interface NoiseSettingsProps {
	config: NoiseConfig;
	onChange: (config: Partial<NoiseConfig>) => void;
}

/**
 * 🎛️ Componente de configuración para la capa de ruido
 */
export const NoiseSettings = ({ config, onChange }: NoiseSettingsProps) => {
	return (
		<div className="space-y-6">
			{/* 🎨 Tipo de ruido */}
			<SettingsSection title="Tipo de Ruido">
				<Select
					value={config.noiseType}
					onValueChange={(noiseType) => onChange({ noiseType: noiseType as NoiseConfig['noiseType'] })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="perlin">Perlin</SelectItem>
						<SelectItem value="simplex">Simplex</SelectItem>
						<SelectItem value="value">Valor</SelectItem>
						<SelectItem value="worley">Worley</SelectItem>
						<SelectItem value="fractal">Fractal</SelectItem>
					</SelectContent>
				</Select>
			</SettingsSection>

			{/* 📊 Escala */}
			<SettingsSection title="Escala">
				<Slider
					value={[config.scale]}
					onValueChange={([scale]) => onChange({ scale })}
					min={1}
					max={100}
					step={1}
					className="w-full"
				/>
			</SettingsSection>

			{/* 💪 Intensidad */}
			<SettingsSection title="Intensidad">
				<Slider
					value={[config.intensity]}
					onValueChange={([intensity]) => onChange({ intensity })}
					min={0}
					max={1}
					step={0.01}
					className="w-full"
				/>
			</SettingsSection>

			{/* 🌈 Modo de color */}
			<SettingsSection title="Modo de Color">
				<Select
					value={config.colorMode}
					onValueChange={(colorMode) => onChange({ colorMode: colorMode as NoiseConfig['colorMode'] })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar modo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="monochrome">Monocromático</SelectItem>
						<SelectItem value="rgb">RGB</SelectItem>
						<SelectItem value="hsl">HSL</SelectItem>
					</SelectContent>
				</Select>
			</SettingsSection>

			{/* 🎲 Semilla */}
			<SettingsSection title="Semilla">
				<div className="flex items-center gap-4">
					<Slider
						value={[config.seed]}
						onValueChange={([seed]) => onChange({ seed })}
						min={0}
						max={999999}
						step={1}
						className="flex-1"
					/>
					<button
						onClick={() => onChange({ seed: Math.floor(Math.random() * 1000000) })}
						className="px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
					>
						🎲
					</button>
				</div>
			</SettingsSection>

			{/* 🎯 Zona de efecto */}
			<SettingsSection title="Zona de Efecto">
				<ZoneSelector
					zone={config.zone}
					onChange={(zone) => onChange({ zone })}
				/>
			</SettingsSection>

			{/* 📊 Configuración fractal */}
			{config.noiseType === 'fractal' && (
				<SettingsSection title="Configuración Fractal">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Octavas</Label>
							<Slider
								value={[config.fractalConfig?.octaves || 1]}
								onValueChange={([octaves]) => onChange({
									fractalConfig: { ...config.fractalConfig, octaves }
								})}
								min={1}
								max={8}
								step={1}
								className="w-full"
							/>
						</div>
						<div className="space-y-2">
							<Label>Persistencia</Label>
							<Slider
								value={[config.fractalConfig?.persistence || 0.5]}
								onValueChange={([persistence]) => onChange({
									fractalConfig: { ...config.fractalConfig, persistence }
								})}
								min={0}
								max={1}
								step={0.01}
								className="w-full"
							/>
						</div>
						<div className="space-y-2">
							<Label>Lacunaridad</Label>
							<Slider
								value={[config.fractalConfig?.lacunarity || 2]}
								onValueChange={([lacunarity]) => onChange({
									fractalConfig: { ...config.fractalConfig, lacunarity }
								})}
								min={1}
								max={4}
								step={0.1}
								className="w-full"
							/>
						</div>
					</div>
				</SettingsSection>
			)}

			{/* ⚡ Animación */}
			<SettingsSection title="Animación">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="animated">Activar Animación</Label>
						<Switch
							id="animated"
							checked={config.animated}
							onCheckedChange={(animated) => onChange({ animated })}
						/>
					</div>
					{config.animated && (
						<Slider
							value={[config.animationSpeed]}
							onValueChange={([animationSpeed]) => onChange({ animationSpeed })}
							min={0.1}
							max={5}
							step={0.1}
							className="w-full"
						/>
					)}
				</div>
			</SettingsSection>
		</div>
	);
};