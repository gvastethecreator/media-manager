'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { GlitchConfig } from '../glitch-schema';

// Componente de sección de configuración simplificado
const SettingsSection = ({
	title,
	children
}: {
	title: string;
	children: React.ReactNode
}) => (
	<div className="space-y-3 py-2 border-b border-border pb-4 last:border-b-0 last:pb-0">
		<h3 className="text-sm font-medium">{title}</h3>
		<div className="space-y-2">{children}</div>
	</div>
);

// Componente selector de zona simplificado
const ZoneSelector = ({
	zone,
	onChange
}: {
	zone: any;
	onChange: (zone: any) => void
}) => {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>Tipo de Zona</Label>
				<Select
					value={zone?.type || "fullscreen"}
					onValueChange={(type) => onChange({ ...zone, type })}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="fullscreen">Pantalla completa</SelectItem>
						<SelectItem value="circle">Círculo</SelectItem>
						<SelectItem value="rectangle">Rectángulo</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{zone?.type === 'circle' && (
				<>
					<div className="space-y-2">
						<Label>Radio</Label>
						<Slider
							value={[zone.radius || 0.5]}
							onValueChange={([radius]) => onChange({ ...zone, radius })}
							min={0}
							max={1}
							step={0.01}
						/>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-2">
							<Label>Posición X</Label>
							<Slider
								value={[(zone.center?.x || 0.5) * 100]}
								onValueChange={([x]) => onChange({
									...zone,
									center: {
										...zone.center,
										x: x / 100
									}
								})}
								min={0}
								max={100}
								step={1}
							/>
						</div>
						<div className="space-y-2">
							<Label>Posición Y</Label>
							<Slider
								value={[(zone.center?.y || 0.5) * 100]}
								onValueChange={([y]) => onChange({
									...zone,
									center: {
										...zone.center,
										y: y / 100
									}
								})}
								min={0}
								max={100}
								step={1}
							/>
						</div>
					</div>
				</>
			)}

			{zone?.type === 'rectangle' && (
				<>
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-2">
							<Label>Ancho</Label>
							<Slider
								value={[zone.size?.width || 0.5]}
								onValueChange={([width]) => onChange({
									...zone,
									size: {
										...zone.size,
										width
									}
								})}
								min={0}
								max={1}
								step={0.01}
							/>
						</div>
						<div className="space-y-2">
							<Label>Alto</Label>
							<Slider
								value={[zone.size?.height || 0.5]}
								onValueChange={([height]) => onChange({
									...zone,
									size: {
										...zone.size,
										height
									}
								})}
								min={0}
								max={1}
								step={0.01}
							/>
						</div>
					</div>
				</>
			)}

			<div className="space-y-2">
				<Label>Suavizado de bordes</Label>
				<Slider
					value={[zone.feather || 0]}
					onValueChange={([feather]) => onChange({ ...zone, feather })}
					min={0}
					max={0.5}
					step={0.01}
				/>
			</div>
		</div>
	);
};

interface GlitchSettingsProps {
	config: GlitchConfig;
	onChange: (config: Partial<GlitchConfig>) => void;
}

/**
 * 🎛️ Componente de configuración para la capa de glitch
 */
export const GlitchSettings = ({ config, onChange }: GlitchSettingsProps) => {
	return (
		<div className="space-y-6">
			{/* 🎨 Tipo de glitch */}
			<SettingsSection title="Tipo de Glitch">
				<Select
					value={config.glitchType}
					onValueChange={(glitchType) => onChange({ glitchType: glitchType as GlitchConfig['glitchType'] })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="digital">Digital</SelectItem>
						<SelectItem value="analog">Analógico</SelectItem>
						<SelectItem value="rgb">RGB</SelectItem>
						<SelectItem value="slice">Cortes</SelectItem>
						<SelectItem value="corruption">Corrupción</SelectItem>
					</SelectContent>
				</Select>
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

			{/* 🌈 Canales de color */}
			<SettingsSection title="Canales de Color">
				<div className="space-y-4">
					{['red', 'green', 'blue'].map((channel) => (
						<div key={channel} className="space-y-2">
							<Label className="capitalize">{channel}</Label>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>Desplazamiento X</Label>
									<Slider
										value={[config.colorChannels?.[channel]?.offset?.x || 0]}
										onValueChange={([x]) => onChange({
											colorChannels: {
												...config.colorChannels,
												[channel]: {
													...config.colorChannels?.[channel],
													offset: {
														x,
														y: config.colorChannels?.[channel]?.offset?.y || 0,
													},
													intensity: config.colorChannels?.[channel]?.intensity || 0,
												},
											},
										})}
										min={-1}
										max={1}
										step={0.01}
										className="w-full"
									/>
								</div>
								<div>
									<Label>Desplazamiento Y</Label>
									<Slider
										value={[config.colorChannels?.[channel]?.offset?.y || 0]}
										onValueChange={([y]) => onChange({
											colorChannels: {
												...config.colorChannels,
												[channel]: {
													...config.colorChannels?.[channel],
													offset: {
														x: config.colorChannels?.[channel]?.offset?.x || 0,
														y,
													},
													intensity: config.colorChannels?.[channel]?.intensity || 0,
												},
											},
										})}
										min={-1}
										max={1}
										step={0.01}
										className="w-full"
									/>
								</div>
							</div>
							<div>
								<Label>Intensidad</Label>
								<Slider
									value={[config.colorChannels?.[channel]?.intensity || 0]}
									onValueChange={([intensity]) => onChange({
										colorChannels: {
											...config.colorChannels,
											[channel]: {
												...config.colorChannels?.[channel],
												offset: {
													x: config.colorChannels?.[channel]?.offset?.x || 0,
													y: config.colorChannels?.[channel]?.offset?.y || 0,
												},
												intensity,
											},
										},
									})}
									min={0}
									max={1}
									step={0.01}
									className="w-full"
								/>
							</div>
						</div>
					))}
				</div>
			</SettingsSection>

			{/* ⚡ Animación */}
			<SettingsSection title="Animación">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Label>Activar Animación</Label>
						<Switch
							checked={!!config.animation}
							onCheckedChange={(checked) => onChange({
								animation: checked ? {
									frequency: 2,
									duration: 100,
									randomness: 0.5,
								} : undefined,
							})}
						/>
					</div>
					{config.animation && (
						<>
							<div className="space-y-2">
								<Label>Frecuencia</Label>
								<Slider
									value={[config.animation.frequency]}
									onValueChange={([frequency]) => onChange({
										animation: {
											...config.animation,
											frequency,
										},
									})}
									min={0}
									max={10}
									step={0.1}
									className="w-full"
								/>
							</div>
							<div className="space-y-2">
								<Label>Duración</Label>
								<Slider
									value={[config.animation.duration]}
									onValueChange={([duration]) => onChange({
										animation: {
											...config.animation,
											duration,
										},
									})}
									min={0}
									max={1000}
									step={10}
									className="w-full"
								/>
							</div>
							<div className="space-y-2">
								<Label>Aleatoriedad</Label>
								<Slider
									value={[config.animation.randomness]}
									onValueChange={([randomness]) => onChange({
										animation: {
											...config.animation,
											randomness,
										},
									})}
									min={0}
									max={1}
									step={0.01}
									className="w-full"
								/>
							</div>
						</>
					)}
				</div>
			</SettingsSection>

			{/* 📺 Efectos adicionales */}
			<SettingsSection title="Efectos Adicionales">
				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Líneas de Escaneo</Label>
							<Switch
								checked={config.scanlines}
								onCheckedChange={(scanlines) => onChange({ scanlines })}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Ruido</Label>
						<Slider
							value={[config.noise]}
							onValueChange={([noise]) => onChange({ noise })}
							min={0}
							max={1}
							step={0.01}
							className="w-full"
						/>
					</div>
					<div className="space-y-2">
						<Label>Compresión</Label>
						<Slider
							value={[config.compression]}
							onValueChange={([compression]) => onChange({ compression })}
							min={0}
							max={1}
							step={0.01}
							className="w-full"
						/>
					</div>
				</div>
			</SettingsSection>
		</div>
	);
};