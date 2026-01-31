/**
 * @file Modern Appearance Settings
 * @module components/settings/modern/appearance-settings-modern
 * @description Configuración de apariencia, temas y modo oscuro usando Global Store real
 */

import { Check, Image as ImageIcon, LayoutGrid, Monitor, Moon, Palette, Sun, Type } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group-v3';
import { Switch } from '@/components/ui/switch-v3';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

// Imports de lógica real
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';
import { SettingsCard, SettingsGroup, SettingsRow } from '../modern/settings-card';

type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
type Density = 'comfortable' | 'default' | 'compact';

// Lista de temas disponibles con tokens CSS
const THEMES = [
	{ id: 'light', label: 'Claro', icon: Sun, color: 'var(--dt-warning-500)' },
	{ id: 'dark', label: 'Oscuro', icon: Moon, color: 'var(--dt-primary-500)' },
	{ id: 'cafe', label: 'Café', icon: Sun, color: 'var(--dt-neutral-500)' },
	{ id: 'violeta', label: 'Violeta', icon: Moon, color: 'var(--dt-primary-600)' },
	{ id: 'madera', label: 'Madera', icon: Sun, color: 'var(--dt-warning-600)' },
	{ id: 'nocturno', label: 'Nocturno', icon: Moon, color: 'var(--dt-primary-700)' },
	{ id: 'verde', label: 'Verde', icon: Sun, color: 'var(--dt-success-500)' },
	{ id: 'atardecer', label: 'Atardecer', icon: Sun, color: 'var(--dt-warning-500)' },
	{ id: 'corporativo', label: 'Corporativo', icon: Monitor, color: 'var(--dt-primary-500)' },
	{ id: 'carbon', label: 'Carbón', icon: Moon, color: 'var(--dt-neutral-700)' },
	{ id: 'teal', label: 'Teal', icon: Sun, color: 'var(--dt-success-600)' },
	{ id: 'citrico', label: 'Cítrico', icon: Sun, color: 'var(--dt-warning-400)' },
	{ id: 'aurora', label: 'Aurora', icon: Moon, color: 'var(--dt-primary-400)' },
	{ id: 'neon', label: 'Neón', icon: Moon, color: 'var(--dt-success-400)' },
] as const;

export function AppearanceSettingsModern() {
	// Hooks reales
	const { theme, setTheme, resolvedTheme } = useTheme();
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s) => s.setPreferences);

	// Mapeo seguro de valores
	const fontSize = (preferences?.fontSize as FontSize) || 'base';
	const density = (preferences?.density as Density) || 'default';

	if (!preferences) {
		return <div className="p-4 text-center text-muted-foreground">Cargando configuración...</div>;
	}

	const currentTheme = theme || 'system';

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-semibold text-2xl text-foreground">Apariencia</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Personaliza el tema, colores y estilo de la interfaz. Los cambios se aplican inmediatamente.
				</p>
			</div>

			{/* Theme Selector Card - Grid de temas */}
			<SettingsCard
				color="var(--primary)"
				description="Elige entre modo claro, oscuro o cualquiera de los 14 temas disponibles. Cada tema ajusta automáticamente los colores de la interfaz."
				icon={<Palette />}
				title="Tema de Color"
			>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{THEMES.map((t) => {
						const Icon = t.icon;
						const isSelected = currentTheme === t.id;
						return (
							<button
								className={cn(
									'group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200',
									'hover:border-border/80 hover:bg-muted/50',
									isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-card'
								)}
								key={t.id}
								onClick={() => setTheme(t.id)}
								type="button"
							>
								{/* Check indicator */}
								{isSelected && (
									<div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
										<Check className="h-3 w-3" />
									</div>
								)}

								{/* Theme preview circle usando color-mix */}
								<div
									className="flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110"
									style={{
										background: `linear-gradient(135deg, ${t.color} 0%, color-mix(in oklch, ${t.color} 70%, black) 100%)`,
										boxShadow: isSelected
											? `0 0 0 2px var(--primary), 0 4px 12px color-mix(in oklch, ${t.color} 25%, transparent)`
											: 'none',
									}}
								>
									<Icon className="h-5 w-5 text-white" />
								</div>

								{/* Theme label */}
								<span className={cn('font-medium text-sm', isSelected && 'text-primary')}>{t.label}</span>
							</button>
						);
					})}
				</div>

				{/* System preference option */}
				<div className="mt-4 border-border/50 border-t pt-4">
					<button
						className={cn(
							'flex w-full items-center gap-3 rounded-lg border p-3 transition-all',
							currentTheme === 'system'
								? 'border-primary bg-primary/5'
								: 'border-border/50 bg-card hover:border-border/80 hover:bg-muted/50'
						)}
						onClick={() => setTheme('system')}
						type="button"
					>
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
							<Monitor className="h-5 w-5 text-muted-foreground" />
						</div>
						<div className="flex-1 text-left">
							<span className="font-medium text-foreground">Automático</span>
							<p className="text-muted-foreground text-xs">
								Usar preferencia del sistema ({resolvedTheme === 'dark' ? 'oscuro' : 'claro'})
							</p>
						</div>
						{currentTheme === 'system' && (
							<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<Check className="h-3 w-3" />
							</div>
						)}
					</button>
				</div>
			</SettingsCard>

			{/* Typography & Density Card */}
			<SettingsCard
				color="var(--primary)"
				description="Ajusta el tamaño de fuente, la densidad de la interfaz y el espaciado entre elementos"
				icon={<Type />}
				title="Tipografía y Densidad"
			>
				<SettingsGroup title="Tamaño de Fuente">
					<RadioGroup onValueChange={(v) => setPreferences({ fontSize: v as FontSize })} value={preferences.fontSize}>
						<div className="flex flex-col gap-3">
							{[
								{ value: 'xs', label: 'Extra pequeño', size: 'text-xs', desc: '12px - Compacto' },
								{ value: 'sm', label: 'Pequeño', size: 'text-sm', desc: '14px - Eficiente' },
								{ value: 'base', label: 'Normal', size: 'text-base', desc: '16px - Balanceado' },
								{ value: 'lg', label: 'Grande', size: 'text-lg', desc: '18px - Legible' },
								{ value: 'xl', label: 'Extra grande', size: 'text-xl', desc: '20px - Accesible' },
							].map((item) => (
								<RadioGroupItem
									className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 p-3 transition-all hover:border-border/80 hover:bg-muted/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
									key={item.value}
									value={item.value}
								>
									<span className={cn(item.size, 'w-16 font-semibold text-foreground')}>Abc</span>
									<div className="flex flex-1 flex-col">
										<span className="font-medium text-foreground text-sm">{item.label}</span>
										<span className="text-muted-foreground text-xs">{item.desc}</span>
									</div>
								</RadioGroupItem>
							))}
						</div>
					</RadioGroup>
				</SettingsGroup>

				<SettingsGroup title="Densidad de Interfaz">
					<div className="grid grid-cols-3 gap-3">
						{[
							{
								value: 'comfortable',
								label: 'Espaciado',
								desc: 'Más espacio entre elementos',
							},
							{
								value: 'default',
								label: 'Normal',
								desc: 'Balance entre espacio y contenido',
							},
							{
								value: 'compact',
								label: 'Compacto',
								desc: 'Máximo contenido visible',
							},
						].map((item) => (
							<button
								className={cn(
									'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
									'hover:border-border/80 hover:bg-muted/50',
									density === item.value ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'
								)}
								key={item.value}
								onClick={() => setPreferences({ density: item.value as Density })}
								type="button"
							>
								<span className={cn('font-medium text-sm', density === item.value && 'text-primary')}>
									{item.label}
								</span>
								<span className="text-muted-foreground text-xs leading-tight">{item.desc}</span>
							</button>
						))}
					</div>
				</SettingsGroup>
			</SettingsCard>

			{/* Display & Effects Card */}
			<SettingsCard
				color="var(--primary)"
				description="Controla las animaciones y efectos visuales de la interfaz. Desactivar animaciones puede mejorar el rendimiento en dispositivos más lentos."
				icon={<LayoutGrid />}
				title="Efectos Visuales"
			>
				<SettingsRow
					description="Habilita transiciones suaves entre estados de la interfaz"
					label="Animaciones Globales"
				>
					<Switch checked={preferences.animations} onCheckedChange={(v) => setPreferences({ animations: v })} />
				</SettingsRow>

				<SettingsRow
					description="Efectos de elevación y brillo al pasar el cursor sobre items"
					label="Animaciones en Miniaturas"
				>
					<Switch
						checked={preferences.thumbnailsAnimations}
						onCheckedChange={(v) => setPreferences({ thumbnailsAnimations: v })}
					/>
				</SettingsRow>

				<SettingsRow
					description="Desactiva todos los efectos visuales costosos para máximo rendimiento"
					label="Modo Ultra Performance"
				>
					<Switch
						checked={preferences.thumbnailsUltraPerformance}
						onCheckedChange={(v) => setPreferences({ thumbnailsUltraPerformance: v })}
					/>
				</SettingsRow>
			</SettingsCard>

			{/* Media Display Card */}
			<SettingsCard
				color="var(--entity-image)"
				description="Configura cómo se muestran las imágenes y videos en los grids de la aplicación"
				icon={<ImageIcon />}
				title="Visualización de Media"
			>
				<SettingsGroup title="Opciones de Grid">
					<SettingsRow
						description="Mantiene las proporciones originales de las imágenes en lugar de forzar cuadrados"
						label="Respetar Aspect Ratio"
					>
						<Switch
							checked={preferences.thumbnailsRespectAspectRatio}
							onCheckedChange={(v) => setPreferences({ thumbnailsRespectAspectRatio: v })}
						/>
					</SettingsRow>

					<SettingsRow
						description="Muestra información adicional como etiquetas y metadatos sobre las imágenes"
						label="Mostrar Metadatos en Grid"
					>
						<Switch
							checked={Boolean(preferences.showMetadataInGrid)}
							onCheckedChange={(v: boolean) => setPreferences({ showMetadataInGrid: v })}
						/>
					</SettingsRow>

					<SettingsRow
						description="Ajusta la calidad de las miniaturas. Mayor calidad consume más recursos."
						label="Calidad de Miniaturas"
					>
						<div className="flex items-center gap-2">
							<select
								className="rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
									setPreferences({ thumbnailQuality: e.target.value as 'low' | 'medium' | 'high' })
								}
								value={String(preferences.thumbnailQuality || 'medium')}
							>
								<option value="low">Baja (rápido)</option>
								<option value="medium">Media (balance)</option>
								<option value="high">Alta (detallado)</option>
							</select>
						</div>
					</SettingsRow>
				</SettingsGroup>
			</SettingsCard>
		</div>
	);
}
