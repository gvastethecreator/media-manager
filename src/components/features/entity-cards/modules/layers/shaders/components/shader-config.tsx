import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type React from 'react';
import { type ShaderType, useShaderStore } from '../actions/shader-config.action';

interface ShaderConfigProps {
	className?: string;
}

const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay'] as const;
const SHADER_TYPES: ShaderType[] = ['distortion', 'hologram', 'wave', 'particle'];

export const ShaderConfig: React.FC<ShaderConfigProps> = ({ className }) => {
	const { configs, activeType, setActiveType, updateConfig } = useShaderStore();
	const activeConfig = activeType ? configs[activeType] : null;

	if (!activeType || !activeConfig) return null;

	const handleToggle = (enabled: boolean) => {
		updateConfig(activeType, { enabled });
	};

	const handleOpacityChange = (value: number[]) => {
		updateConfig(activeType, { opacity: value[0] });
	};

	const handleBlendModeChange = (value: string) => {
		updateConfig(activeType, { blendMode: value });
	};

	const renderTypeSpecificControls = () => {
		switch (activeType) {
			case 'distortion':
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Intensidad</Label>
							<Slider
								value={[activeConfig.intensity]}
								min={0}
								max={1}
								step={0.01}
								onValueChange={(value) => updateConfig(activeType, { intensity: value[0] })}
							/>
						</div>
					</div>
				);

			case 'hologram':
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Intensidad de líneas</Label>
							<Slider
								value={[activeConfig.scanlineIntensity]}
								min={0}
								max={1}
								step={0.01}
								onValueChange={(value) => updateConfig(activeType, { scanlineIntensity: value[0] })}
							/>
						</div>
						{/* Color picker podría ir aquí */}
					</div>
				);

			case 'wave':
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Amplitud</Label>
							<Slider
								value={[activeConfig.amplitude]}
								min={0}
								max={1}
								step={0.01}
								onValueChange={(value) => updateConfig(activeType, { amplitude: value[0] })}
							/>
						</div>
						<div className="space-y-2">
							<Label>Frecuencia</Label>
							<Slider
								value={[activeConfig.frequency]}
								min={1}
								max={20}
								step={0.1}
								onValueChange={(value) => updateConfig(activeType, { frequency: value[0] })}
							/>
						</div>
					</div>
				);

			case 'particle':
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Tamaño de partículas</Label>
							<Slider
								value={[activeConfig.particleSize]}
								min={0}
								max={1}
								step={0.01}
								onValueChange={(value) => updateConfig(activeType, { particleSize: value[0] })}
							/>
						</div>
						<div className="space-y-2">
							<Label>Densidad de partículas</Label>
							<Slider
								value={[activeConfig.particleDensity]}
								min={0}
								max={1}
								step={0.01}
								onValueChange={(value) => updateConfig(activeType, { particleDensity: value[0] })}
							/>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className={cn('space-y-6', className)}>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>Tipo de Shader</Label>
					<Select value={activeType} onValueChange={(value: ShaderType) => setActiveType(value)}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Seleccionar tipo" />
						</SelectTrigger>
						<SelectContent>
							{SHADER_TYPES.map((type) => (
								<SelectItem key={type} value={type}>
									{type.charAt(0).toUpperCase() + type.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center justify-between">
					<Label>Habilitado</Label>
					<Switch checked={activeConfig.enabled} onCheckedChange={handleToggle} />
				</div>

				<div className="space-y-2">
					<Label>Opacidad</Label>
					<Slider
						value={[activeConfig.opacity]}
						min={0}
						max={1}
						step={0.01}
						onValueChange={handleOpacityChange}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Label>Modo de mezcla</Label>
					<Select value={activeConfig.blendMode} onValueChange={handleBlendModeChange}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Seleccionar modo" />
						</SelectTrigger>
						<SelectContent>
							{BLEND_MODES.map((mode) => (
								<SelectItem key={mode} value={mode}>
									{mode.charAt(0).toUpperCase() + mode.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{renderTypeSpecificControls()}
		</div>
	);
};