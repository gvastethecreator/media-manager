'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { SettingsSection } from '../../components/settings-section';
import { ZoneSelector } from '../../components/zone-selector';
import type { GlitchConfig } from '../glitch-schema';

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