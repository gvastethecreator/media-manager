/**
 * @file Modern Appearance Settings
 * @module components/settings/modern/appearance-settings-modern
 * @description Configuración de apariencia, temas y modo oscuro usando Global Store real
 */

import { Check, Edit, Image as ImageIcon, LayoutGrid, Monitor, Moon, Palette, Plus, Sun, Type } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/ui/theme-provider';
import { cn } from '@/lib/utils';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';
// Imports de lógica real
import { useCustomThemeStore } from '@/store/entities/themes/custom-theme.store';
import { BUILT_IN_THEMES } from '@/types/theme';
import { BentoGrid, SettingsCard, SettingsGroup, SettingsPageHeader, SettingsRow } from '../modern/settings-card';
import { ThemeColorStrip } from '../themes/theme-preview';
import { ThemeSettings } from '../themes/theme-settings';

type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
type Density = 'comfortable' | 'default' | 'compact';
type Theme =
	| 'light'
	| 'dark'
	| 'cafe'
	| 'violeta'
	| 'madera'
	| 'nocturno'
	| 'verde'
	| 'atardecer'
	| 'corporativo'
	| 'carbon'
	| 'teal'
	| 'citrico'
	| 'aurora'
	| 'neon'
	| 'system';

export function AppearanceSettingsModern() {
	// Hooks reales
	const { theme, setTheme, resolvedTheme } = useTheme();
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s) => s.setPreferences);
	const { customThemes, applyThemeToDOM } = useCustomThemeStore();

	// Estado para vista de temas expandida
	const [showThemeSettings, setShowThemeSettings] = useState(false);

	// Mapeo seguro de valores
	const fontSize = (preferences?.fontSize as FontSize) || 'base';
	const density = (preferences?.density as Density) || 'default';

	if (!preferences) {
		return <div className="p-4 text-center text-muted-foreground">Loading settings...</div>;
	}

	const currentTheme = theme || 'system';

	// Si se muestra la vista de temas completa
	if (showThemeSettings) {
		return (
			<div className="space-y-4">
				<Button className="mb-2" onClick={() => setShowThemeSettings(false)} size="sm" variant="ghost">
					← Back to Appearance
				</Button>
				<ThemeSettings />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<SettingsPageHeader
				description="Customize the interface theme, colors, and style. Changes apply immediately."
				title="Appearance"
			/>

			<BentoGrid>
				<SettingsCard
					className="md:col-span-2 xl:col-span-4"
					color="var(--primary)"
					description="Choose light mode, dark mode, or one of the 14 available themes. Each theme adjusts the interface colors automatically."
					icon={<Palette />}
					title="Color Theme"
				>
					{/* Quick access to built-in themes (showing first 8) */}
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
						{BUILT_IN_THEMES.slice(0, 8).map((t) => {
							const Icon = t.icon === 'sun' ? Sun : t.icon === 'moon' ? Moon : Monitor;
							const isSelected = currentTheme === t.id;
							return (
								<button
									className={cn(
										'group relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200',
										'hover:border-border/80 hover:bg-muted/50',
										isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-card'
									)}
									key={t.id}
									onClick={() => setTheme(t.id as Theme)}
									type="button"
								>
									{/* Check indicator */}
									{isSelected && (
										<div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
											<Check className="h-2.5 w-2.5" />
										</div>
									)}

									{/* Theme preview circle usando color-mix */}
									<div
										className="flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110"
										style={{
											background: `linear-gradient(135deg, ${t.previewColor} 0%, color-mix(in oklch, ${t.previewColor} 70%, black) 100%)`,
											boxShadow: isSelected
												? `0 0 0 2px var(--primary), 0 4px 12px color-mix(in oklch, ${t.previewColor} 25%, transparent)`
												: 'none',
										}}
									>
										<Icon className="h-4 w-4" style={{ color: 'var(--background)' }} />
									</div>

									{/* Theme label */}
									<span className={cn('font-medium text-xs', isSelected && 'text-primary')}>{t.name}</span>
								</button>
							);
						})}
					</div>

					{/* Custom themes preview (if any) */}
					{customThemes.length > 0 && (
						<div className="mt-4 border-border/50 border-t pt-4">
							<div className="mb-2 flex items-center justify-between">
								<span className="font-medium text-muted-foreground text-sm">My Themes ({customThemes.length})</span>
							</div>
							<div className="flex flex-wrap gap-2">
								{customThemes.slice(0, 4).map((t) => (
									<button
										className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 transition-all hover:border-border/80"
										key={t.id}
										onClick={() => applyThemeToDOM(t)}
										type="button"
									>
										<ThemeColorStrip colors={t.colors} />
										<span className="text-xs">{t.name}</span>
									</button>
								))}
								{customThemes.length > 4 && (
									<span className="flex items-center text-muted-foreground text-xs">
										+{customThemes.length - 4} more
									</span>
								)}
							</div>
						</div>
					)}

					{/* System preference + Link to full theme editor */}
					<div className="mt-4 flex flex-col gap-3 border-border/50 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
						<button
							className={cn(
								'flex flex-1 items-center gap-3 rounded-lg border p-3 transition-all',
								currentTheme === 'system'
									? 'border-primary bg-primary/5'
									: 'border-border/50 bg-card hover:border-border/80 hover:bg-muted/50'
							)}
							onClick={() => setTheme('system')}
							type="button"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
								<Monitor className="h-4 w-4 text-muted-foreground" />
							</div>
							<div className="flex-1 text-left">
								<span className="font-medium text-foreground text-sm">Automatic</span>
								<p className="text-muted-foreground text-xs">
									Follow system ({resolvedTheme === 'dark' ? 'dark' : 'light'})
								</p>
							</div>
							{currentTheme === 'system' && (
								<div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
									<Check className="h-2.5 w-2.5" />
								</div>
							)}
						</button>

						<div className="flex gap-2">
							<Button className="gap-2" onClick={() => setShowThemeSettings(true)} size="sm" variant="outline">
								<Edit className="h-3.5 w-3.5" />
								Edit Themes
							</Button>
							<Button className="gap-2" onClick={() => setShowThemeSettings(true)} size="sm" variant="default">
								<Plus className="h-3.5 w-3.5" />
								Create Theme
							</Button>
						</div>
					</div>
				</SettingsCard>

				{/* Typography & Density Card */}
				<SettingsCard
					className="md:col-span-2 xl:col-span-2"
					color="var(--primary)"
					description="Adjust font size, interface density, and spacing"
					icon={<Type />}
					title="Typography and Density"
				>
					<SettingsGroup title="Font Size">
						<RadioGroup onValueChange={(v) => setPreferences({ fontSize: v as FontSize })} value={preferences.fontSize}>
							<div className="flex flex-col gap-3">
								{[
									{ value: 'xs', label: 'Extra small', size: 'text-xs', desc: '12px - Compact' },
									{ value: 'sm', label: 'Small', size: 'text-sm', desc: '14px - Efficient' },
									{ value: 'base', label: 'Normal', size: 'text-base', desc: '16px - Balanced' },
									{ value: 'lg', label: 'Large', size: 'text-lg', desc: '18px - Readable' },
									{ value: 'xl', label: 'Extra large', size: 'text-xl', desc: '20px - Accessible' },
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

					<SettingsGroup title="Interface Density">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							{[
								{
									value: 'comfortable',
									label: 'Comfortable',
									desc: 'More space between items',
								},
								{
									value: 'default',
									label: 'Normal',
									desc: 'Balanced spacing and content',
								},
								{
									value: 'compact',
									label: 'Compact',
									desc: 'Show as much content as possible',
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
					className="md:col-span-1 xl:col-span-1"
					color="var(--primary)"
					description="Control interface animations and visual effects. Disabling animations can improve performance on slower devices."
					icon={<LayoutGrid />}
					title="Visual Effects"
				>
					<SettingsRow description="Enable smooth transitions between interface states" label="Global Animations">
						<Switch checked={preferences.animations} onCheckedChange={(v) => setPreferences({ animations: v })} />
					</SettingsRow>

					<SettingsRow description="Add subtle elevation effects when hovering over items" label="Thumbnail Animations">
						<Switch
							checked={preferences.thumbnailsAnimations}
							onCheckedChange={(v) => setPreferences({ thumbnailsAnimations: v })}
						/>
					</SettingsRow>

					<SettingsRow
						description="Disable expensive visual effects for maximum performance"
						label="Ultra Performance Mode"
					>
						<Switch
							checked={preferences.thumbnailsUltraPerformance}
							onCheckedChange={(v) => setPreferences({ thumbnailsUltraPerformance: v })}
						/>
					</SettingsRow>
				</SettingsCard>

				{/* Media Display Card */}
				<SettingsCard
					className="md:col-span-1 xl:col-span-1"
					color="var(--entity-image)"
					description="Configure how images and videos appear in application grids"
					icon={<ImageIcon />}
					title="Media Display"
				>
					<SettingsGroup title="Grid Options">
						<SettingsRow
							description="Keep original image proportions instead of forcing square thumbnails"
							label="Preserve Aspect Ratio"
						>
							<Switch
								checked={preferences.thumbnailsRespectAspectRatio}
								onCheckedChange={(v) => setPreferences({ thumbnailsRespectAspectRatio: v })}
							/>
						</SettingsRow>

						<SettingsRow
							description="Show extra information such as tags and metadata over images"
							label="Show Grid Metadata"
						>
							<Switch
								checked={Boolean(preferences.showMetadataInGrid)}
								onCheckedChange={(v: boolean) => setPreferences({ showMetadataInGrid: v })}
							/>
						</SettingsRow>

						<SettingsRow
							description="Adjust thumbnail quality. Higher quality uses more resources."
							label="Thumbnail Quality"
						>
							<div className="flex items-center gap-2">
								<select
									className="rounded-md border border-border/50 bg-background px-3 py-1.5 text-foreground text-sm outline-none focus:border-primary"
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										setPreferences({ thumbnailQuality: e.target.value as 'low' | 'medium' | 'high' })
									}
									value={String(preferences.thumbnailQuality || 'medium')}
								>
									<option value="low">Low (fast)</option>
									<option value="medium">Medium (balanced)</option>
									<option value="high">High (detailed)</option>
								</select>
							</div>
						</SettingsRow>
					</SettingsGroup>
				</SettingsCard>
			</BentoGrid>
		</div>
	);
}
