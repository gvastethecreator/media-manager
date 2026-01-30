/**
 * @file Modern Appearance Settings
 * @module components/settings/modern/appearance-settings-modern
 * @description Configuración de apariencia, temas y modo oscuro usando Global Store real
 */

import React from 'react';
import {
	Moon,
	Palette,
	Sun,
	Monitor,
	Sliders,
	Type,
	Image as ImageIcon,
	LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
	SettingsCard,
	SettingsGroup,
	SettingsRow,
} from '../modern/settings-card';

// Imports de lógica real
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';
import { useTheme } from '@/hooks/use-theme';

type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Density = 'comfortable' | 'default' | 'compact';

export function AppearanceSettingsModern() {
	// Hooks reales
	const { theme, setTheme } = useTheme();
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s) => s.setPreferences);

	// Helpers para mapeo de valores
	const handleGridDensityChange = (value: number[]) => {
		// Asumiendo que 'mosaic' es el valor representativo para la demo
		setPreferences({
			thumbnailsBorderRadius: { ...preferences?.thumbnailsBorderRadius, mosaic: value[0] }
		});
	};

	// Mapeo seguro de valores
	const fontSize = (preferences?.fontSize as FontSize) || 'base';
	const density = 'default'; // TODO: Agregar density al store si no existe

	if (!preferences) {
		return <div className="p-4 text-center">Cargando configuración...</div>;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-semibold text-foreground">Apariencia</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Personaliza el tema, colores y estilo de la interfaz
				</p>
			</div>

			{/* Color Scheme Card */}
			<SettingsCard
				icon={<Palette />}
				title="Tema"
				description="Elige entre modo claro, oscuro o automático"
				color="var(--primary)"
			>
				<RadioGroup value={theme} onValueChange={(v) => setTheme(v as any)}>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						{/* Light Mode */}
						<RadioGroupItem
							value="light"
							className="flex h-24 flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
						>
							<Sun className="h-8 w-8 text-amber-500" />
							<Label htmlFor="light" className="cursor-pointer">
								<span className="font-medium">Claro</span>
							</Label>
						</RadioGroupItem>

						{/* Dark Mode */}
						<RadioGroupItem
							value="dark"
							className="flex h-24 flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
						>
							<Moon className="h-8 w-8 text-indigo-500" />
							<Label htmlFor="dark" className="cursor-pointer">
								<span className="font-medium">Oscuro</span>
							</Label>
						</RadioGroupItem>

						{/* Auto Mode */}
						<RadioGroupItem
							value="system"
							className="flex h-24 flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
						>
							<Monitor className="h-8 w-8 text-muted-foreground" />
							<Label htmlFor="system" className="cursor-pointer">
								<span className="font-medium">Automático</span>
							</Label>
						</RadioGroupItem>
					</div>
				</RadioGroup>
			</SettingsCard>

			{/* Typography & Density Card */}
			<SettingsCard
				icon={<Type />}
				title="Tipografía"
				description="Ajusta tamaño de fuente"
				color="var(--primary)"
			>
				<SettingsGroup title="Tamaño de Fuente">
					<div className="flex flex-col gap-3">
						{[
							{ value: 'xs', label: 'Extra pequeño', size: 'text-xs' },
							{ value: 'sm', label: 'Pequeño', size: 'text-sm' },
							{ value: 'base', label: 'Normal', size: 'text-base' },
							{ value: 'lg', label: 'Grande', size: 'text-lg' },
							{ value: 'xl', label: 'Extra grande', size: 'text-xl' },
						].map((item) => (
							<RadioGroupItem
								key={item.value}
								value={item.value}
								checked={preferences.fontSize === item.value}
								onClick={() => setPreferences({ fontSize: item.value as FontSize })}
								className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
							>
								<span className={item.size}>Abc</span>
								<span className="text-sm">{item.label}</span>
							</RadioGroupItem>
						))}
					</div>
				</SettingsGroup>
			</SettingsCard>

			{/* Display & Effects Card */}
			<SettingsCard
				icon={<LayoutGrid />}
				title="Efectos Visuales"
				description="Animaciones y rendimiento"
				color="var(--primary)"
			>
				<SettingsRow label="Animaciones Globales" description="Habilitar animaciones de interfaz">
					<Switch
						checked={preferences.animations}
						onCheckedChange={(v) => setPreferences({ animations: v })}
					/>
				</SettingsRow>

				<SettingsRow label="Animaciones en Miniaturas" description="Efectos hover en items">
					<Switch
						checked={preferences.thumbnailsAnimations}
						onCheckedChange={(v) => setPreferences({ thumbnailsAnimations: v })}
					/>
				</SettingsRow>

				<SettingsRow label="Ultra Performance" description="Desactivar efectos costosos">
					<Switch
						checked={preferences.thumbnailsUltraPerformance}
						onCheckedChange={(v) => setPreferences({ thumbnailsUltraPerformance: v })}
					/>
				</SettingsRow>
			</SettingsCard>

			{/* Media Display Card */}
			<SettingsCard
				icon={<ImageIcon />}
				title="Visualización de Media"
				description="Configuración de grid"
				color="var(--entity-image)"
			>
				<SettingsGroup title="Opciones de Grid">
					<div className="space-y-3">
						<SettingsRow label="Respetar Aspect Ratio" description="Mantener proporción original en grid">
							<Switch
								checked={preferences.thumbnailsRespectAspectRatio}
								onCheckedChange={(v) => setPreferences({ thumbnailsRespectAspectRatio: v })}
							/>
						</SettingsRow>
					</div>
				</SettingsGroup>
			</SettingsCard>
		</div>
	);
}
