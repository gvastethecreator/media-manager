/**
 * @file Modern Appearance Settings
 * @module components/settings/modern/appearance-settings-modern
 * @description Configuración de apariencia, temas y modo oscuro usando Global Store real
 */

import { Image as ImageIcon, LayoutGrid, Monitor, Moon, Palette, Sun, Type } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/use-theme';

// Imports de lógica real
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';
import { SettingsCard, SettingsGroup, SettingsRow } from '../modern/settings-card';

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
			thumbnailsBorderRadius: { ...preferences?.thumbnailsBorderRadius, mosaic: value[0] },
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
				<h2 className="font-semibold text-2xl text-foreground">Apariencia</h2>
				<p className="mt-1 text-muted-foreground text-sm">Personaliza el tema, colores y estilo de la interfaz</p>
			</div>

			{/* Color Scheme Card */}
			<SettingsCard
				color="var(--primary)"
				description="Elige entre modo claro, oscuro o automático"
				icon={<Palette />}
				title="Tema"
			>
				<RadioGroup onValueChange={(v) => setTheme(v as any)} value={theme}>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						{/* Light Mode */}
						<RadioGroupItem
							className="flex h-24 flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
							value="light"
						>
							<Sun className="h-8 w-8 text-amber-500" />
							<Label className="cursor-pointer" htmlFor="light">
								<span className="font-medium">Claro</span>
							</Label>
						</RadioGroupItem>

						{/* Dark Mode */}
						<RadioGroupItem
							className="flex h-24 flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
							value="dark"
						>
							<Moon className="h-8 w-8 text-indigo-500" />
							<Label className="cursor-pointer" htmlFor="dark">
								<span className="font-medium">Oscuro</span>
							</Label>
						</RadioGroupItem>

						{/* Auto Mode */}
						<RadioGroupItem
							className="flex h-24 flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
							value="system"
						>
							<Monitor className="h-8 w-8 text-muted-foreground" />
							<Label className="cursor-pointer" htmlFor="system">
								<span className="font-medium">Automático</span>
							</Label>
						</RadioGroupItem>
					</div>
				</RadioGroup>
			</SettingsCard>

			{/* Typography & Density Card */}
			<SettingsCard color="var(--primary)" description="Ajusta tamaño de fuente" icon={<Type />} title="Tipografía">
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
								checked={preferences.fontSize === item.value}
								className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
								key={item.value}
								onClick={() => setPreferences({ fontSize: item.value as FontSize })}
								value={item.value}
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
				color="var(--primary)"
				description="Animaciones y rendimiento"
				icon={<LayoutGrid />}
				title="Efectos Visuales"
			>
				<SettingsRow description="Habilitar animaciones de interfaz" label="Animaciones Globales">
					<Switch checked={preferences.animations} onCheckedChange={(v) => setPreferences({ animations: v })} />
				</SettingsRow>

				<SettingsRow description="Efectos hover en items" label="Animaciones en Miniaturas">
					<Switch
						checked={preferences.thumbnailsAnimations}
						onCheckedChange={(v) => setPreferences({ thumbnailsAnimations: v })}
					/>
				</SettingsRow>

				<SettingsRow description="Desactivar efectos costosos" label="Ultra Performance">
					<Switch
						checked={preferences.thumbnailsUltraPerformance}
						onCheckedChange={(v) => setPreferences({ thumbnailsUltraPerformance: v })}
					/>
				</SettingsRow>
			</SettingsCard>

			{/* Media Display Card */}
			<SettingsCard
				color="var(--entity-image)"
				description="Configuración de grid"
				icon={<ImageIcon />}
				title="Visualización de Media"
			>
				<SettingsGroup title="Opciones de Grid">
					<div className="space-y-3">
						<SettingsRow description="Mantener proporción original en grid" label="Respetar Aspect Ratio">
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
