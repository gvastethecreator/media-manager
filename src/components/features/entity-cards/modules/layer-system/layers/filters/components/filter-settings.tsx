'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '../../components/color-picker';
import { SettingsSection } from '../../components/settings-section';
import { FilterConfig, FilterType } from '../filter-schema';

interface FilterSettingsProps {
	config: FilterConfig;
	onChange: (config: Partial<FilterConfig>) => void;
}

/**
 * 🎛️ Componente de configuración para la capa de filtros
 */
export const FilterSettings = ({ config, onChange }: FilterSettingsProps) => {
	// 🎨 Manejar cambio de tipo de filtro
	const handleFilterTypeChange = (filterType: FilterType) => {
		onChange({ filterType });
	};

	// 🎚️ Renderizar configuración de filtros básicos
	const renderBasicSettings = () => (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>Brillo</Label>
				<Slider
					value={[config.basic.brightness]}
					onValueChange={([brightness]) => onChange({ basic: { ...config.basic, brightness } })}
					min={0}
					max={200}
					step={1}
					className="w-full"
				/>
			</div>
			<div className="space-y-2">
				<Label>Contraste</Label>
				<Slider
					value={[config.basic.contrast]}
					onValueChange={([contrast]) => onChange({ basic: { ...config.basic, contrast } })}
					min={0}
					max={200}
					step={1}
					className="w-full"
				/>
			</div>
			<div className="space-y-2">
				<Label>Saturación</Label>
				<Slider
					value={[config.basic.saturation]}
					onValueChange={([saturation]) => onChange({ basic: { ...config.basic, saturation } })}
					min={0}
					max={200}
					step={1}
					className="w-full"
				/>
			</div>
			<div className="space-y-2">
				<Label>Rotación de Color</Label>
				<Slider
					value={[config.basic.hueRotate]}
					onValueChange={([hueRotate]) => onChange({ basic: { ...config.basic, hueRotate } })}
					min={-180}
					max={180}
					step={1}
					className="w-full"
				/>
			</div>
			<div className="space-y-2">
				<Label>Desenfoque</Label>
				<Slider
					value={[config.basic.blur]}
					onValueChange={([blur]) => onChange({ basic: { ...config.basic, blur } })}
					min={0}
					max={20}
					step={0.1}
					className="w-full"
				/>
			</div>
			<div className="space-y-2">
				<Label>Opacidad</Label>
				<Slider
					value={[config.basic.opacity]}
					onValueChange={([opacity]) => onChange({ basic: { ...config.basic, opacity } })}
					min={0}
					max={100}
					step={1}
					className="w-full"
				/>
			</div>
		</div>
	);

	// ✨ Renderizar configuración de resplandor
	const renderGlowSettings = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>Activar Resplandor</Label>
				<Switch
					checked={config.glow?.enabled ?? false}
					onCheckedChange={(enabled) => onChange({
						glow: { ...config.glow, enabled },
					})}
				/>
			</div>
			{config.glow?.enabled && (
				<>
					<div className="space-y-2">
						<Label>Color</Label>
						<ColorPicker
							color={config.glow.color}
							onChange={(color) => onChange({
								glow: { ...config.glow, color },
							})}
						/>
					</div>
					<div className="space-y-2">
						<Label>Radio</Label>
						<Slider
							value={[config.glow.radius]}
							onValueChange={([radius]) => onChange({
								glow: { ...config.glow, radius },
							})}
							min={0}
							max={100}
							step={1}
							className="w-full"
						/>
					</div>
					<div className="space-y-2">
						<Label>Intensidad</Label>
						<Slider
							value={[config.glow.intensity]}
							onValueChange={([intensity]) => onChange({
								glow: { ...config.glow, intensity },
							})}
							min={0}
							max={1}
							step={0.01}
							className="w-full"
						/>
					</div>
					<div className="space-y-2">
						<Label>Dispersión</Label>
						<Slider
							value={[config.glow.spread]}
							onValueChange={([spread]) => onChange({
								glow: { ...config.glow, spread },
							})}
							min={0}
							max={100}
							step={1}
							className="w-full"
						/>
					</div>
				</>
			)}
		</div>
	);

	// 🌑 Renderizar configuración de sombra
	const renderShadowSettings = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>Activar Sombra</Label>
				<Switch
					checked={config.shadow?.enabled ?? false}
					onCheckedChange={(enabled) => onChange({
						shadow: { ...config.shadow, enabled },
					})}
				/>
			</div>
			{config.shadow?.enabled && (
				<>
					<div className="space-y-2">
						<Label>Color</Label>
						<ColorPicker
							color={config.shadow.color}
							onChange={(color) => onChange({
								shadow: { ...config.shadow, color },
							})}
						/>
					</div>
					<div className="space-y-2">
						<Label>Desenfoque</Label>
						<Slider
							value={[config.shadow.blur]}
							onValueChange={([blur]) => onChange({
								shadow: { ...config.shadow, blur },
							})}
							min={0}
							max={100}
							step={1}
							className="w-full"
						/>
					</div>
					<div className="space-y-2">
						<Label>Desplazamiento X</Label>
						<Slider
							value={[config.shadow.offsetX]}
							onValueChange={([offsetX]) => onChange({
								shadow: { ...config.shadow, offsetX },
							})}
							min={-100}
							max={100}
							step={1}
							className="w-full"
						/>
					</div>
					<div className="space-y-2">
						<Label>Desplazamiento Y</Label>
						<Slider
							value={[config.shadow.offsetY]}
							onValueChange={([offsetY]) => onChange({
								shadow: { ...config.shadow, offsetY },
							})}
							min={-100}
							max={100}
							step={1}
							className="w-full"
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label>Sombra Interior</Label>
						<Switch
							checked={config.shadow.inset}
							onCheckedChange={(inset) => onChange({
								shadow: { ...config.shadow, inset },
							})}
						/>
					</div>
				</>
			)}
		</div>
	);

	// 🌊 Renderizar configuración de distorsión
	const renderDistortionSettings = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label>Activar Distorsión</Label>
				<Switch
					checked={config.distortion?.enabled ?? false}
					onCheckedChange={(enabled) => onChange({
						distortion: { ...config.distortion, enabled },
					})}
				/>
			</div>
			{config.distortion?.enabled && (
				<>
					<div className="space-y-2">
						<Label>Tipo</Label>
						<Select
							value={config.distortion.type}
							onValueChange={(type) => onChange({
								distortion: { ...config.distortion, type: type as any },
							})}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="wave">Onda</SelectItem>
								<SelectItem value="ripple">Ondulación</SelectItem>
								<SelectItem value="twist">Torsión</SelectItem>
								<SelectItem value="bulge">Abultamiento</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Cantidad</Label>
						<Slider
							value={[config.distortion.amount]}
							onValueChange={([amount]) => onChange({
								distortion: { ...config.distortion, amount },
							})}
							min={0}
							max={100}
							step={1}
							className="w-full"
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label>Animación</Label>
						<Switch
							checked={config.distortion.animated}
							onCheckedChange={(animated) => onChange({
								distortion: { ...config.distortion, animated },
							})}
						/>
					</div>
					{config.distortion.animated && (
						<div className="space-y-2">
							<Label>Velocidad</Label>
							<Slider
								value={[config.distortion.speed]}
								onValueChange={([speed]) => onChange({
									distortion: { ...config.distortion, speed },
								})}
								min={0}
								max={10}
								step={0.1}
								className="w-full"
							/>
						</div>
					)}
				</>
			)}
		</div>
	);

	return (
		<div className="space-y-6">
			{/* 🎨 Tipo de filtro */}
			<SettingsSection title="Tipo de Filtro">
				<Select
					value={config.filterType}
					onValueChange={(value) => handleFilterTypeChange(value as FilterType)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="basic">Básico</SelectItem>
						<SelectItem value="glow">Resplandor</SelectItem>
						<SelectItem value="shadow">Sombra</SelectItem>
						<SelectItem value="distortion">Distorsión</SelectItem>
					</SelectContent>
				</Select>
			</SettingsSection>

			{/* 🎭 Modo de fusión */}
			<SettingsSection title="Modo de Fusión">
				<Select
					value={config.blendMode}
					onValueChange={(blendMode) => onChange({ blendMode: blendMode as any })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar modo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="normal">Normal</SelectItem>
						<SelectItem value="multiply">Multiplicar</SelectItem>
						<SelectItem value="screen">Pantalla</SelectItem>
						<SelectItem value="overlay">Superponer</SelectItem>
						<SelectItem value="darken">Oscurecer</SelectItem>
						<SelectItem value="lighten">Aclarar</SelectItem>
						<SelectItem value="color-dodge">Sobreexposición</SelectItem>
						<SelectItem value="color-burn">Subexposición</SelectItem>
						<SelectItem value="hard-light">Luz Fuerte</SelectItem>
						<SelectItem value="soft-light">Luz Suave</SelectItem>
						<SelectItem value="difference">Diferencia</SelectItem>
						<SelectItem value="exclusion">Exclusión</SelectItem>
						<SelectItem value="hue">Tono</SelectItem>
						<SelectItem value="saturation">Saturación</SelectItem>
						<SelectItem value="color">Color</SelectItem>
						<SelectItem value="luminosity">Luminosidad</SelectItem>
					</SelectContent>
				</Select>
			</SettingsSection>

			{/* 🎛️ Configuración específica según el tipo */}
			<SettingsSection title="Configuración">
				{config.filterType === 'basic' && renderBasicSettings()}
				{config.filterType === 'glow' && renderGlowSettings()}
				{config.filterType === 'shadow' && renderShadowSettings()}
				{config.filterType === 'distortion' && renderDistortionSettings()}
			</SettingsSection>
		</div>
	);
};