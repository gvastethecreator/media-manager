// src/components/settings/interface-section.tsx
// Sección de interfaz para controlar tipografía, tema, animaciones y otros aspectos visuales
// 🛠️ Cumple con los lineamientos de arquitectura y stack del proyecto

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';

/**
 * InterfaceSection
 * Sección de configuración de interfaz de usuario (tipografía, tema, animaciones, etc)
 *
 * 🚧 Este componente es un stub inicial. Se expandirá con controles reales y lógica de integración.
 */
const InterfaceSection: React.FC = () => {
	// Acceso a preferencias y setter desde Zustand
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s: any) => (s.setPreferences ? s.setPreferences : () => {}));

	return (
		<Card className="bg-muted/30 rounded-sm border-none">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
					<span>Interfaz</span>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-3">
				<div className="flex flex-col gap-4">
					{/* Selector de tipografía */}
					<div className="flex flex-col gap-1">
						<Label htmlFor="fontFamily">Tipografía</Label>
						<Select value={preferences.fontFamily} onValueChange={(v) => setPreferences({ fontFamily: v })}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="system">Sistema</SelectItem>
								<SelectItem value="serif">Serif</SelectItem>
								<SelectItem value="mono">Monoespaciada</SelectItem>
								<SelectItem value="rounded">Redondeada</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{/* Selector de tamaño de fuente */}
					<div className="flex flex-col gap-1">
						<Label htmlFor="fontSize">Tamaño de fuente</Label>
						<Select value={preferences.fontSize} onValueChange={(v) => setPreferences({ fontSize: v })}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="sm">Pequeño</SelectItem>
								<SelectItem value="md">Mediano</SelectItem>
								<SelectItem value="lg">Grande</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{/* Selector de tema */}
					<div className="flex flex-col gap-1">
						<Label htmlFor="theme">Tema</Label>
						<Select value={preferences.theme} onValueChange={(v) => setPreferences({ theme: v })}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="system">Sistema</SelectItem>
								<SelectItem value="light">Claro</SelectItem>
								<SelectItem value="dark">Oscuro</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{/* Switch de animaciones */}
					<div className="flex items-center gap-3">
						<Label htmlFor="animations">Animaciones</Label>
						<Switch
							checked={preferences.animations}
							onCheckedChange={(v) => setPreferences({ animations: v })}
							id="animations"
						/>
					</div>
					{/* Thumbnails: Respetar aspect ratio en grilla */}
					<div className="flex items-center gap-3">
						<Label htmlFor="thumbnailsRespectAspectRatio">Respetar aspect ratio (grilla)</Label>
						<Switch
							checked={preferences.thumbnailsRespectAspectRatio}
							onCheckedChange={(v) => setPreferences({ thumbnailsRespectAspectRatio: v })}
							id="thumbnailsRespectAspectRatio"
						/>
					</div>
					{/* Thumbnails: Bordes redondeados por modo */}
					<div className="flex flex-col gap-1">
						<Label>Borde redondeado thumbnails</Label>
						<div className="flex gap-2 items-center">
							<span className="text-xs text-muted-foreground w-12">Grilla</span>
							<Input
								type="number"
								min={0}
								max={32}
								value={preferences.thumbnailsBorderRadius.grid}
								onChange={(e) =>
									setPreferences({
										thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, grid: Number(e.target.value) },
									})
								}
								className="w-16"
							/>
							<span className="text-xs text-muted-foreground w-12">Card</span>
							<Input
								type="number"
								min={0}
								max={32}
								value={preferences.thumbnailsBorderRadius.card}
								onChange={(e) =>
									setPreferences({
										thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, card: Number(e.target.value) },
									})
								}
								className="w-16"
							/>
							<span className="text-xs text-muted-foreground w-12">Mosaico</span>
							<Input
								type="number"
								min={0}
								max={32}
								value={preferences.thumbnailsBorderRadius.mosaic}
								onChange={(e) =>
									setPreferences({
										thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, mosaic: Number(e.target.value) },
									})
								}
								className="w-16"
							/>
						</div>
					</div>
					{/* Thumbnails: Animaciones */}
					<div className="flex items-center gap-3">
						<Label htmlFor="thumbnailsAnimations">Animaciones de thumbnails</Label>
						<Switch
							checked={preferences.thumbnailsAnimations}
							onCheckedChange={(v) => setPreferences({ thumbnailsAnimations: v })}
							id="thumbnailsAnimations"
						/>
					</div>
					{/* Thumbnails: Ultra performance */}
					<div className="flex items-center gap-3">
						<Label htmlFor="thumbnailsUltraPerformance">Modo ultra performance</Label>
						<Switch
							checked={preferences.thumbnailsUltraPerformance}
							onCheckedChange={(v) => setPreferences({ thumbnailsUltraPerformance: v })}
							id="thumbnailsUltraPerformance"
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default InterfaceSection;
