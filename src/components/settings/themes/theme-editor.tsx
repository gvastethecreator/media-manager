/**
 * @file Theme Editor
 * @module components/settings/themes/theme-editor
 * @description Editor completo de temas personalizados con color pickers por categoría
 */

import { ArrowLeft, Copy, Download, Paintbrush, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCustomThemeStore } from '@/store/entities/themes/custom-theme.store';
import type { CustomTheme, ThemeColors } from '@/types/theme';
import { DEFAULT_THEME_COLORS, THEME_COLOR_CATEGORIES } from '@/types/theme';
import { ThemeColorPicker } from './theme-color-picker';
import { ThemePreview } from './theme-preview';

interface ThemeEditorProps {
	/** Clase adicional */
	className?: string;
	/** Callback al cancelar */
	onCancel: () => void;
	/** Callback al eliminar */
	onDelete?: (themeId: string) => void;
	/** Callback al guardar */
	onSave: (theme: CustomTheme) => void;
	/** Tema a editar (null para crear nuevo) */
	theme: CustomTheme | null;
}

/**
 * Genera ID único para nuevo tema
 */
function generateThemeId(): string {
	return `custom-theme-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Editor completo de tema con todas las categorías de color
 */
export function ThemeEditor({ theme, onSave, onCancel, onDelete, className }: ThemeEditorProps) {
	const { applyThemeToDOM, resetToActiveTheme } = useCustomThemeStore();

	// Estado del tema en edición
	const [editedTheme, setEditedTheme] = useState<CustomTheme>(() => {
		if (theme) return { ...theme };

		const now = new Date().toISOString();
		return {
			id: generateThemeId(),
			name: 'New Theme',
			description: '',
			author: 'User',
			isDark: true,
			createdAt: now,
			updatedAt: now,
			colors: { ...DEFAULT_THEME_COLORS },
		};
	});

	const [isPreviewLive, setIsPreviewLive] = useState(true);
	const [hasChanges, setHasChanges] = useState(false);
	const [activeCategory, setActiveCategory] = useState('base');

	// Aplicar preview en vivo
	useEffect(() => {
		if (isPreviewLive) {
			applyThemeToDOM(editedTheme);
		}

		return () => {
			if (isPreviewLive) {
				resetToActiveTheme();
			}
		};
	}, [isPreviewLive, editedTheme, applyThemeToDOM, resetToActiveTheme]);

	// Detectar cambios
	useEffect(() => {
		if (theme) {
			const hasAnyChange =
				JSON.stringify(editedTheme.colors) !== JSON.stringify(theme.colors) ||
				editedTheme.name !== theme.name ||
				editedTheme.description !== theme.description;
			setHasChanges(hasAnyChange);
		} else {
			setHasChanges(true);
		}
	}, [editedTheme, theme]);

	// Handlers
	const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
		setEditedTheme((prev) => ({
			...prev,
			colors: { ...prev.colors, [key]: value },
			updatedAt: new Date().toISOString(),
		}));
	}, []);

	const handleMetadataChange = useCallback((updates: Partial<CustomTheme>) => {
		setEditedTheme((prev) => ({
			...prev,
			...updates,
			updatedAt: new Date().toISOString(),
		}));
	}, []);

	const handleSave = useCallback(() => {
		onSave(editedTheme);
	}, [editedTheme, onSave]);

	const handleReset = useCallback(() => {
		if (theme) {
			setEditedTheme({ ...theme });
		} else {
			setEditedTheme((prev) => ({
				...prev,
				colors: { ...DEFAULT_THEME_COLORS },
			}));
		}
	}, [theme]);

	const handleExport = useCallback(() => {
		const json = JSON.stringify(editedTheme, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${editedTheme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}, [editedTheme]);

	const handleCopyColors = useCallback(() => {
		const css = Object.entries(editedTheme.colors)
			.map(([key, value]) => {
				const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
				return `--${cssVar}: ${value};`;
			})
			.join('\n');
		navigator.clipboard.writeText(css);
	}, [editedTheme.colors]);

	// Categoría activa
	const currentCategory = useMemo(() => THEME_COLOR_CATEGORIES.find((c) => c.id === activeCategory), [activeCategory]);

	return (
		<div className={cn('flex h-full flex-col', className)}>
			{/* Header */}
			<div className="flex items-center justify-between border-border/50 border-b p-4">
				<div className="flex items-center gap-3">
					<Button onClick={onCancel} size="icon" variant="ghost">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h2 className="font-semibold text-lg">{theme ? 'Edit Theme' : 'Create Theme'}</h2>
						<p className="text-muted-foreground text-xs">{hasChanges ? 'Unsaved changes' : 'Sin cambios'}</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* Preview toggle */}
					<div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
						<Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
						<span className="text-muted-foreground text-xs">Preview</span>
						<Switch checked={isPreviewLive} className="scale-75" onCheckedChange={setIsPreviewLive} />
					</div>

					{/* Actions */}
					<Button disabled={!hasChanges} onClick={handleReset} size="icon" variant="ghost">
						<RotateCcw className="h-4 w-4" />
					</Button>
					<Button onClick={handleExport} size="icon" variant="ghost">
						<Download className="h-4 w-4" />
					</Button>
					<Button onClick={handleCopyColors} size="icon" variant="ghost">
						<Copy className="h-4 w-4" />
					</Button>
					{theme && onDelete && (
						<Button
							className="text-destructive hover:text-destructive"
							onClick={() => onDelete(theme.id)}
							size="icon"
							variant="ghost"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}

					<Button disabled={!hasChanges} onClick={handleSave}>
						<Save className="mr-2 h-4 w-4" />
						Save
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar - Preview y Metadata */}
				<div className="w-72 shrink-0 border-border/50 border-r p-4">
					<ScrollArea className="h-full">
						<div className="flex flex-col gap-4">
							{/* Live Preview */}
							<div className="flex flex-col gap-2">
								<Label className="text-muted-foreground text-xs">Preview</Label>
								<ThemePreview className="w-full" colors={editedTheme.colors} name={editedTheme.name} size="lg" />
							</div>

							{/* Metadata */}
							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Name</Label>
									<Input
										onChange={(e) => handleMetadataChange({ name: e.target.value })}
										placeholder="My Theme"
										value={editedTheme.name}
									/>
								</div>

								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Description</Label>
									<Textarea
										onChange={(e) => handleMetadataChange({ description: e.target.value })}
										placeholder="Describe your theme..."
										rows={2}
										value={editedTheme.description || ''}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label className="text-xs">Dark Theme</Label>
									<Switch checked={editedTheme.isDark} onCheckedChange={(isDark) => handleMetadataChange({ isDark })} />
								</div>

								{editedTheme.baseTheme && (
									<div className="flex flex-col gap-1">
										<Label className="text-muted-foreground text-xs">Basado en</Label>
										<span className="text-xs">{editedTheme.baseTheme}</span>
									</div>
								)}
							</div>
						</div>
					</ScrollArea>
				</div>

				{/* Main - Color Editors */}
				<div className="flex flex-1 flex-col overflow-hidden">
					{/* Category tabs */}
					<Tabs className="flex flex-1 flex-col" onValueChange={setActiveCategory} value={activeCategory}>
						<div className="border-border/50 border-b px-4">
							<TabsList className="h-10 w-full justify-start gap-1 bg-transparent p-0">
								{THEME_COLOR_CATEGORIES.map((category) => (
									<TabsTrigger
										className="rounded-none border-transparent border-b-2 px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
										key={category.id}
										value={category.id}
									>
										{category.name}
									</TabsTrigger>
								))}
							</TabsList>
						</div>

						{/* Color editors per category */}
						{THEME_COLOR_CATEGORIES.map((category) => (
							<TabsContent className="mt-0 flex-1 overflow-hidden" key={category.id} value={category.id}>
								<ScrollArea className="h-full p-4">
									<div className="flex flex-col gap-2">
										<div className="mb-2">
											<h3 className="font-medium text-sm">{category.name}</h3>
											<p className="text-muted-foreground text-xs">{category.description}</p>
										</div>

										<div className="grid grid-cols-2 gap-4">
											{category.colors.map((colorKey) => (
												<ThemeColorPicker
													defaultValue={DEFAULT_THEME_COLORS[colorKey]}
													key={colorKey}
													label={colorKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
													onChange={(value) => handleColorChange(colorKey, value)}
													value={editedTheme.colors[colorKey] || DEFAULT_THEME_COLORS[colorKey] || ''}
												/>
											))}
										</div>
									</div>
								</ScrollArea>
							</TabsContent>
						))}
					</Tabs>
				</div>
			</div>
		</div>
	);
}

/**
 * Diálogo de confirmación para eliminar tema
 */
export function DeleteThemeConfirm({
	themeName,
	onConfirm,
	onCancel,
}: {
	themeName: string;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
					<Trash2 className="h-5 w-5 text-destructive" />
				</div>
				<div>
					<h3 className="font-semibold">Delete Theme</h3>
					<p className="text-muted-foreground text-sm">
						Delete <strong>{themeName}</strong>? This action cannot be undone.
					</p>
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button onClick={onCancel} variant="outline">
					Cancel
				</Button>
				<Button onClick={onConfirm} variant="destructive">
					Delete
				</Button>
			</div>
		</div>
	);
}
