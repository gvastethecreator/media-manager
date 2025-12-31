// src/components/settings/interface-section.tsx
// Configuración de interfaz unificada (apilada) con aplicación inmediata

import { Settings } from 'lucide-react';
import React, { useId } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/use-theme';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

// Opciones de Google Fonts (preview en menú) + sistema
const FONT_OPTIONS = [
	{ value: 'system', label: 'System', sample: 'Sistema rápido' },
	{ value: 'inter', label: 'Inter', sample: 'Inter versátil' },
	{ value: 'roboto', label: 'Roboto', sample: 'Roboto legible' },
	{ value: 'open-sans', label: 'Open Sans', sample: 'Open Sans limpio' },
	{ value: 'lato', label: 'Lato', sample: 'Lato moderno' },
	{ value: 'montserrat', label: 'Montserrat', sample: 'Montserrat elegante' },
	{ value: 'poppins', label: 'Poppins', sample: 'Poppins redondeada' },
	{ value: 'source-sans', label: 'Source Sans', sample: 'Source Sans neutra' },
	{ value: 'serif', label: 'Serif', sample: 'Serif clásica' },
	{ value: 'georgia', label: 'Georgia', sample: 'Georgia editorial' },
	{ value: 'playfair', label: 'Playfair', sample: 'Playfair display' },
	{ value: 'merriweather', label: 'Merriweather', sample: 'Merriweather lectura' },
	{ value: 'mono', label: 'Monospace', sample: 'Fuente código' },
	{ value: 'jetbrains-mono', label: 'JetBrains Mono', sample: 'JetBrains code' },
	{ value: 'fira-code', label: 'Fira Code', sample: 'Fira ligaduras' },
	{ value: 'ubuntu-mono', label: 'Ubuntu Mono', sample: 'Ubuntu legible' },
	{ value: 'rounded', label: 'Rounded', sample: 'Texto amable' },
];

// Escala ampliada solicitada
const FONT_SIZE_OPTIONS = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

// Temas unificados con navegación (useTheme) + opción system
const mapThemeLabel = (t: string) => {
	if (t === 'system') return 'Sistema';
	return t.charAt(0).toUpperCase() + t.slice(1);
};

const InterfaceSection: React.FC = () => {
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s: any) => (s.setPreferences ? s.setPreferences : () => {}));
	// Tema unificado
	const { theme, setTheme, themes } = useTheme();
	// Estado de vista para sincronizar default view si cambia
	const viewMode = useViewOptionsStore((s) => s.viewMode);
	const setViewMode = useViewOptionsStore((s) => s.setViewMode);

	const animationsId = useId();
	const thumbnailsRespectAspectRatioId = useId();
	const thumbnailsAnimationsId = useId();
	const thumbnailsUltraPerformanceId = useId();

	const updateFileBrowserConfig = (section: 'general' | 'performance', key: string, value: any) => {
		setPreferences({
			fileBrowser: {
				...preferences.fileBrowser,
				[section]: {
					...preferences.fileBrowser[section],
					[key]: value,
				},
			},
		});
	};

	const updateViewConfig = (viewType: 'grid' | 'cards' | 'masonry' | 'list', key: string, value: any) => {
		setPreferences({
			fileBrowser: {
				...preferences.fileBrowser,
				views: {
					...preferences.fileBrowser.views,
					[viewType]: {
						...preferences.fileBrowser.views[viewType],
						[key]: value,
					},
				},
			},
		});
	};

	const updateListColumn = (column: string, visible: boolean) => {
		setPreferences({
			fileBrowser: {
				...preferences.fileBrowser,
				views: {
					...preferences.fileBrowser.views,
					list: {
						...preferences.fileBrowser.views.list,
						visibleColumns: {
							...preferences.fileBrowser.views.list.visibleColumns,
							[column]: visible,
						},
					},
				},
			},
		});
	};

	// Aplicar tipografía y tamaño de fuente al DOM de forma reactiva
	React.useEffect(() => {
		const root = document.documentElement;
		// Google Fonts: cargar dinámicamente si no es 'system'
		if (preferences.fontFamily && preferences.fontFamily !== 'system') {
			const fontUrl = `https://fonts.googleapis.com/css2?family=${preferences.fontFamily.replace(/-/g, '+')}:wght@400;700&display=swap`;
			let fontLink = document.getElementById('dynamic-font-link') as HTMLLinkElement | null;
			if (!fontLink) {
				fontLink = document.createElement('link');
				fontLink.id = 'dynamic-font-link';
				fontLink.rel = 'stylesheet';
				document.head.appendChild(fontLink);
			}
			fontLink.href = fontUrl;
			root.style.setProperty('--app-font-family', `'${preferences.fontFamily.replace(/-/g, ' ')}, sans-serif'`);
		} else {
			root.style.setProperty('--app-font-family', 'inherit');
		}
		// Tamaño de fuente
		const fontSizeMap: Record<string, string> = {
			xs: '0.70rem',
			sm: '0.8rem',
			base: '0.9rem',
			md: '1rem',
			lg: '1.1rem',
			xl: '1.25rem',
			'2xl': '1.4rem',
			'3xl': '1.6rem',
			'4xl': '1.8rem',
		};
		root.style.setProperty('--app-font-size', fontSizeMap[preferences.fontSize] || '1rem');
	}, [preferences.fontFamily, preferences.fontSize]);

	// Sincronizar cambio de tema desde preferencias hacia hook y viceversa
	React.useEffect(() => {
		if (preferences.theme !== theme) {
			setPreferences({ theme });
		}
	}, [preferences.theme, theme, setPreferences]);

	const handleThemeChange = (v: string) => {
		setPreferences({ theme: v });
		setTheme(v as any);
	};

	// Aplicar vista por defecto al cargar si difiere
	React.useEffect(() => {
		const def = preferences.fileBrowser.general.defaultViewMode;
		if (viewMode !== def) {
			setViewMode(def as any);
		}
	}, [preferences.fileBrowser.general.defaultViewMode, viewMode, setViewMode]);

	return (
		<div className="space-y-stack-md">
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardHeader className="p-4 pb-2">
					<CardTitle className="flex items-center gap-2 text-heading-sm text-muted-foreground">
						<Settings className="h-4 w-4" />
						<span>Interfaz General</span>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="space-y-stack-sm p-4">
					<div className="grid grid-cols-3 gap-4">
						<div className="col-span-1 flex flex-col gap-1.5">
							<Label className="text-caption">Tipografía</Label>
							<Select onValueChange={(v) => setPreferences({ fontFamily: v })} value={preferences.fontFamily}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Fuente" />
								</SelectTrigger>
								<SelectContent className="max-h-96">
									{FONT_OPTIONS.map((f) => (
										<SelectItem key={f.value} value={f.value}>
											<span
												className="flex flex-col"
												style={{ fontFamily: f.value.startsWith('system') ? 'inherit' : undefined }}
											>
												<span className="text-body-sm">{f.label}</span>
												<span className="text-caption text-muted-foreground">{f.sample}</span>
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="col-span-1 flex flex-col gap-1.5">
							<Label className="text-caption">Tamaño fuente</Label>
							<Select onValueChange={(v) => setPreferences({ fontSize: v })} value={preferences.fontSize}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Tamaño" />
								</SelectTrigger>
								<SelectContent>
									{FONT_SIZE_OPTIONS.map((o) => (
										<SelectItem key={o} value={o}>
											{o.toUpperCase()}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="col-span-1 flex flex-col gap-1.5">
							<Label className="text-caption">Tema</Label>
							<Select onValueChange={handleThemeChange} value={preferences.theme}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Tema" />
								</SelectTrigger>
								<SelectContent className="max-h-80">
									{[...themes, 'system'].map((t) => (
										<SelectItem key={t} value={t}>
											{mapThemeLabel(t)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="col-span-3 grid grid-cols-4 gap-4 pt-3">
							<div className="flex items-center gap-2">
								<Switch
									checked={preferences.animations}
									id={animationsId}
									onCheckedChange={(v) => setPreferences({ animations: v })}
								/>
								<Label className="cursor-pointer text-body-sm" htmlFor={animationsId}>
									Animaciones
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									checked={preferences.thumbnailsRespectAspectRatio}
									id={thumbnailsRespectAspectRatioId}
									onCheckedChange={(v) => setPreferences({ thumbnailsRespectAspectRatio: v })}
								/>
								<Label className="cursor-pointer text-body-sm" htmlFor={thumbnailsRespectAspectRatioId}>
									Aspect Ratio Grilla
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									checked={preferences.thumbnailsAnimations}
									id={thumbnailsAnimationsId}
									onCheckedChange={(v) => setPreferences({ thumbnailsAnimations: v })}
								/>
								<Label className="cursor-pointer text-body-sm" htmlFor={thumbnailsAnimationsId}>
									Animaciones Thumbs
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									checked={preferences.thumbnailsUltraPerformance}
									id={thumbnailsUltraPerformanceId}
									onCheckedChange={(v) => setPreferences({ thumbnailsUltraPerformance: v })}
								/>
								<Label className="cursor-pointer text-body-sm" htmlFor={thumbnailsUltraPerformanceId}>
									Ultra Performance
								</Label>
							</div>
						</div>
						<div className="col-span-3 flex flex-col gap-2 pt-3">
							<Label className="text-caption">Borde thumbnails</Label>
							<div className="grid grid-cols-6 items-center gap-3 text-body-sm">
								<span className="text-muted-foreground">Grid</span>
								<Input
									className="w-20"
									max={32}
									min={0}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, grid: Number(e.target.value) },
										})
									}
									type="number"
									value={preferences.thumbnailsBorderRadius.grid}
								/>
								<span className="text-muted-foreground">Card</span>
								<Input
									className="w-20"
									max={32}
									min={0}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, card: Number(e.target.value) },
										})
									}
									type="number"
									value={preferences.thumbnailsBorderRadius.card}
								/>
								<span className="text-muted-foreground">Mosaico</span>
								<Input
									className="w-20"
									max={32}
									min={0}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, mosaic: Number(e.target.value) },
										})
									}
									type="number"
									value={preferences.thumbnailsBorderRadius.mosaic}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardHeader className="p-4 pb-2">
					<CardTitle className="flex items-center gap-2 text-heading-sm text-muted-foreground">
						<span>Opciones del visor de archivos</span>
						<Badge className="text-caption" variant="secondary">
							FileBrowser
						</Badge>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="space-y-stack-sm p-4">
					{/* Opciones apiladas, no tabs */}
					<div className="flex flex-col gap-4">
						{/* General */}
						<div className="flex flex-col gap-1.5">
							<Label className="text-caption">Vista por defecto</Label>
							<Select
								onValueChange={(v) =>
									setPreferences({
										fileBrowser: {
											...preferences.fileBrowser,
											general: { ...preferences.fileBrowser.general, defaultViewMode: v },
										},
									})
								}
								value={preferences.fileBrowser.general.defaultViewMode}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Vista" />
								</SelectTrigger>
								<SelectContent>
									{['grid', 'cards', 'masonry', 'list'].map((v) => (
										<SelectItem key={v} value={v}>
											{v.charAt(0).toUpperCase() + v.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label className="text-caption">Elementos por lote</Label>
							<Input
								max={200}
								min={10}
								onChange={(e) =>
									setPreferences({
										fileBrowser: {
											...preferences.fileBrowser,
											general: { ...preferences.fileBrowser.general, itemsPerBatch: Number(e.target.value) },
										},
									})
								}
								type="number"
								value={preferences.fileBrowser.general.itemsPerBatch}
							/>
						</div>
						{/* Performance */}
						<div className="flex flex-col gap-1.5">
							<Label className="text-caption">Virtualización</Label>
							<Switch
								checked={preferences.fileBrowser.performance.enableVirtualization}
								onCheckedChange={(v) =>
									setPreferences({
										fileBrowser: {
											...preferences.fileBrowser,
											performance: { ...preferences.fileBrowser.performance, enableVirtualization: v },
										},
									})
								}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label className="text-caption">Calidad de thumbnails</Label>
							<Select
								onValueChange={(v) =>
									setPreferences({
										fileBrowser: {
											...preferences.fileBrowser,
											performance: { ...preferences.fileBrowser.performance, thumbnailQuality: v },
										},
									})
								}
								value={preferences.fileBrowser.performance.thumbnailQuality}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Calidad" />
								</SelectTrigger>
								<SelectContent>
									{['low', 'medium', 'high'].map((q) => (
										<SelectItem key={q} value={q}>
											{q.charAt(0).toUpperCase() + q.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default InterfaceSection;
