/**
 * @file Modern Appearance Settings
 * @module components/settings/modern/appearance-settings-modern
 * @description Configuración de apariencia, temas y modo oscuro
 */

import React, { useState } from 'react';
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

type ColorScheme = 'light' | 'dark' | 'auto';
type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Density = 'comfortable' | 'default' | 'compact';
type AccentColor = 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'red';

const ACCENT_COLORS: Record<AccentColor, { name: string; value: string }> = {
	blue: { name: 'Azul', value: 'hsl(var(--accent-blue))' },
	purple: { name: 'Púrpura', value: 'hsl(var(--accent-purple))' },
	pink: { name: 'Rosa', value: 'hsl(var(--accent-pink))' },
	green: { name: 'Verde', value: 'hsl(var(--accent-green))' },
	orange: { name: 'Naranja', value: 'hsl(var(--accent-orange))' },
	red: { name: 'Rojo', value: 'hsl(var(--accent-red))' },
};

export function AppearanceSettingsModern() {
	const [colorScheme, setColorScheme] = useState<ColorScheme>('auto');
	const [fontSize, setFontSize] = useState<FontSize>('md');
	const [density, setDensity] = useState<Density>('default');
	const [accentColor, setAccentColor] = useState<AccentColor>('blue');
	const [transparency, setTransparency] = useState([80]);
	const [animations, setAnimations] = useState(true);
	const [gridDensity, setGridDensity] = useState([3]);
	const [imageQuality, setImageQuality] = useState([100]);

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
				<RadioGroup value={colorScheme} onValueChange={(v) => setColorScheme(v as ColorScheme)}>
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
							value="auto"
							className="flex h-24 flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
						>
							<Monitor className="h-8 w-8 text-muted-foreground" />
							<Label htmlFor="auto" className="cursor-pointer">
								<span className="font-medium">Automático</span>
							</Label>
						</RadioGroupItem>
					</div>
				</RadioGroup>
			</SettingsCard>

			{/* Accent Color Card */}
			<SettingsCard
				icon={<Sliders />}
				title="Color de Acento"
				description="Elige el color principal de la interfaz"
				color="var(--primary)"
			>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
					{Object.entries(ACCENT_COLORS).map(([key, { name, value }]) => (
						<button
							key={key}
							onClick={() => setAccentColor(key as AccentColor)}
							className={cn(
								'group flex h-16 flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all',
								'hover:bg-muted/50',
								accentColor === key
									? 'border-primary ring-2 ring-primary/20'
									: 'border-transparent'
							)}
						>
							<div
								className="h-6 w-6 rounded-full transition-transform group-hover:scale-110"
								style={{ backgroundColor: value }}
							/>
							<span className="text-xs">{name}</span>
						</button>
					))}
				</div>
			</SettingsCard>

			{/* Typography & Density Card */}
			<SettingsCard
				icon={<Type />}
				title="Tipografía y Densidad"
				description="Ajusta tamaño de fuente y espaciado"
				color="var(--primary)"
			>
				<SettingsGroup title="Tamaño de Fuente">
					<div className="flex flex-col gap-3">
						{[
							{ value: 'xs' as FontSize, label: 'Extra pequeño', size: 'text-xs' },
							{ value: 'sm' as FontSize, label: 'Pequeño', size: 'text-sm' },
							{ value: 'md' as FontSize, label: 'Mediano', size: 'text-base' },
							{ value: 'lg' as FontSize, label: 'Grande', size: 'text-lg' },
							{ value: 'xl' as FontSize, label: 'Extra grande', size: 'text-xl' },
						].map((item) => (
							<RadioGroupItem
								key={item.value}
								value={item.value}
								className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
							>
								<span className={item.size}>Abc</span>
								<span className="text-sm">{item.label}</span>
							</RadioGroupItem>
						))}
					</div>
				</SettingsGroup>

				<Separator />

				<SettingsGroup title="Densidad de Interfaz">
					<Tabs defaultValue={density} onValueChange={(v) => setDensity(v as Density)}>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="comfortable" className="text-sm">
								Confortable
							</TabsTrigger>
							<TabsTrigger value="default" className="text-sm">
								Default
							</TabsTrigger>
							<TabsTrigger value="compact" className="text-sm">
								Compacto
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</SettingsGroup>
			</SettingsCard>

			{/* Display & Effects Card */}
			<SettingsCard
				icon={<LayoutGrid />}
				title="Visualización y Efectos"
				description="Transparencia, animaciones y calidad"
				color="var(--primary)"
			>
				<SettingsRow label="Transparencia del panel" description="Opacidad de paneles flotantes">
					<div className="flex w-48 items-center gap-3">
						<Slider
							value={transparency}
							onValueChange={setTransparency}
							max={100}
							step={5}
							className="flex-1"
						/>
						<span className="text-sm tabular-nums text-muted-foreground w-10">
							{transparency[0]}%
						</span>
					</div>
				</SettingsRow>

				<SettingsRow label="Animaciones" description="Animaciones y transiciones suaves">
					<Switch checked={animations} onCheckedChange={setAnimations} />
				</SettingsRow>
			</SettingsCard>

			{/* Media Display Card */}
			<SettingsCard
				icon={<ImageIcon />}
				title="Visualización de Media"
				description="Configuración de grid y calidad de imágenes"
				color="var(--entity-image)"
			>
				<SettingsGroup title="Densidad de Grid">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label htmlFor="grid-density">Columnas por fila</Label>
							<span className="text-sm text-muted-foreground">{gridDensity[0]} columnas</span>
						</div>
						<Slider
							id="grid-density"
							value={gridDensity}
							onValueChange={setGridDensity}
							min={2}
							max={8}
							step={1}
						/>
					</div>
				</SettingsGroup>

				<Separator />

				<SettingsRow label="Calidad de imágenes" description="Balance entre calidad y rendimiento">
					<div className="flex w-48 items-center gap-3">
						<Slider
							value={imageQuality}
							onValueChange={setImageQuality}
							min={50}
							max={100}
							step={10}
							className="flex-1"
						/>
						<span className="text-sm tabular-nums text-muted-foreground w-10">
							{imageQuality[0]}%
						</span>
					</div>
				</SettingsRow>

				<SettingsRow label="Cargar thumbnails en scroll" description="Lazy loading de miniaturas">
					<Switch defaultChecked />
				</SettingsRow>
			</SettingsCard>

			{/* Reset Card */}
			<SettingsCard
				icon={<Monitor />}
				title="Restaurar Defaults"
				description="Vuelve a la configuración original"
				color="var(--destructive)"
				variant="outlined"
			>
				<Button variant="destructive" className="w-full">
					Restaurar configuración por defecto
				</Button>
			</SettingsCard>
		</div>
	);
}
