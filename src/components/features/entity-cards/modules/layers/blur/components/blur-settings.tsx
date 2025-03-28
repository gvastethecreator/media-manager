'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MotionControls } from '../../components/motion-controls';
import { SettingsSection } from '../../components/settings-section';
import { ZoneSelector } from '../../components/zone-selector';
import type { BlurConfig, Zone as BlurZone, Motion } from '../blur-schema';

interface BlurSettingsProps {
	config: BlurConfig;
	onChange: (config: Partial<BlurConfig>) => void;
}

/**
 * 🎛️ Componente de configuración para la capa de desenfoque
 */
export const BlurSettings = ({ config, onChange }: BlurSettingsProps) => {
	// Helper para convertir la zona de blur al formato que espera el ZoneSelector
	const convertToZoneSelectorFormat = (blurZone: BlurZone): any => {
		return {
			enabled: true,
			centerX: blurZone.position.x,
			centerY: blurZone.position.y,
			radius: blurZone.size.width / 2,
			feather: blurZone.feather,
			type: blurZone.type === 'circle' ? 'circle' : 'rectangle',
		};
	};

	// Helper para convertir desde formato ZoneSelector al formato BlurZone
	const convertFromZoneSelectorFormat = (zoneProps: any): BlurZone => {
		return {
			type: zoneProps.type as 'circle' | 'rectangle' | 'ellipse' | 'custom',
			position: {
				x: zoneProps.centerX || 0.5,
				y: zoneProps.centerY || 0.5,
			},
			size: {
				width: (zoneProps.radius || 0.5) * 2,
				height: (zoneProps.radius || 0.5) * 2,
			},
			rotation: 0,
			feather: zoneProps.feather || 0.1,
			invert: false,
		};
	};

	return (
		<div className="space-y-6">
			{/* 🎚️ Control de radio de desenfoque */}
			<SettingsSection title="Radio de Desenfoque">
				<Slider
					value={[config.radius]}
					onValueChange={([radius]) => onChange({ radius })}
					min={0}
					max={50}
					step={1}
					className="w-full"
				/>
			</SettingsSection>

			{/* 🔄 Selector de algoritmo */}
			<SettingsSection title="Algoritmo">
				<Select
					value={config.algorithm}
					onValueChange={(algorithm) => onChange({ algorithm: algorithm as BlurConfig['algorithm'] })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar algoritmo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="gaussian">Gaussiano</SelectItem>
						<SelectItem value="box">Caja</SelectItem>
						<SelectItem value="motion">Movimiento</SelectItem>
						<SelectItem value="radial">Radial</SelectItem>
						<SelectItem value="zoom">Zoom</SelectItem>
					</SelectContent>
				</Select>
			</SettingsSection>

			{/* 📊 Calidad del desenfoque */}
			<SettingsSection title="Calidad">
				<Select value={String(config.quality)} onValueChange={(quality) => onChange({ quality: Number(quality) })}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar calidad" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="1">Baja</SelectItem>
						<SelectItem value="2">Media</SelectItem>
						<SelectItem value="3">Alta</SelectItem>
					</SelectContent>
				</Select>
			</SettingsSection>

			{/* 🎯 Selector de zona */}
			<SettingsSection title="Zona de Efecto">
				<ZoneSelector
					zone={convertToZoneSelectorFormat(config.zone)}
					onChange={(zone) => onChange({ zone: convertFromZoneSelectorFormat(zone) })}
				/>
			</SettingsSection>

			{/* 🏃‍♂️ Controles de movimiento */}
			{config.algorithm === 'motion' && (
				<SettingsSection title="Configuración de Movimiento">
					<MotionControls motion={config.motion as any} onChange={(motion) => onChange({ motion: motion as Motion })} />
				</SettingsSection>
			)}

			{/* 🎨 Preservar bordes */}
			<SettingsSection title="Preservar Bordes">
				<div className="flex items-center justify-between">
					<Label htmlFor="preserve-edges">Activar</Label>
					<Switch
						id="preserve-edges"
						checked={config.preserveEdges}
						onCheckedChange={(preserveEdges) => onChange({ preserveEdges })}
					/>
				</div>
				{config.preserveEdges && (
					<Slider
						value={[config.edgeThreshold]}
						onValueChange={([edgeThreshold]) => onChange({ edgeThreshold })}
						min={0}
						max={100}
						step={1}
						className="w-full mt-4"
					/>
				)}
			</SettingsSection>

			{/* ⚡ Animación */}
			<SettingsSection title="Animación">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="animated">Activar Animación</Label>
						<Switch id="animated" checked={config.animated} onCheckedChange={(animated) => onChange({ animated })} />
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
