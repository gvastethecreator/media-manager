/**
 * @file Theme Settings
 * @module components/settings/themes/theme-settings
 * @description Página principal de configuración de temas con selector, lista y editor
 */

import { Check, Copy, Download, Edit, Monitor, Moon, Palette, Plus, Sun, Trash2, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme, type Theme } from '@/components/ui/theme-provider';
import { cn } from '@/lib/utils';
import { useCustomThemeStore } from '@/store/entities/themes/custom-theme.store';
import type { CustomTheme } from '@/types/theme';
import { BUILT_IN_THEMES } from '@/types/theme';
import { SettingsCard, SettingsPageHeader } from '../modern/settings-card';
import { DeleteThemeConfirm, ThemeEditor } from './theme-editor';
import { ThemeColorStrip } from './theme-preview';

/**
 * Vista principal de Settings de Temas
 * Incluye selector de temas built-in, lista de custom, y editor
 */
export function ThemeSettings() {
	const { theme: activeTheme, setTheme, resolvedTheme } = useTheme();
	const {
		customThemes,
		addCustomTheme,
		updateCustomTheme,
		deleteCustomTheme,
		createFromBuiltIn,
		duplicateTheme,
		importTheme,
		exportTheme,
		applyThemeToDOM,
	} = useCustomThemeStore();

	const [editorOpen, setEditorOpen] = useState(false);
	const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [themeToDelete, setThemeToDelete] = useState<CustomTheme | null>(null);
	const [newThemeDialogOpen, setNewThemeDialogOpen] = useState(false);
	const [newThemeName, setNewThemeName] = useState('');
	const [selectedBaseTheme, setSelectedBaseTheme] = useState('dark');
	const [importDialogOpen, setImportDialogOpen] = useState(false);

	// Handlers
	const handleSelectBuiltIn = useCallback(
		(themeId: string) => {
			setTheme(themeId as Theme);
		},
		[setTheme]
	);

	const handleSelectCustom = useCallback(
		(theme: CustomTheme) => {
			applyThemeToDOM(theme);
			// También guardamos referencia en localStorage
			localStorage.setItem('active-custom-theme', theme.id);
		},
		[applyThemeToDOM]
	);

	const handleCreateNew = useCallback(() => {
		if (!newThemeName.trim()) return;

		const newTheme = createFromBuiltIn(selectedBaseTheme, newThemeName.trim());
		setNewThemeDialogOpen(false);
		setNewThemeName('');
		setEditingTheme(newTheme);
		setEditorOpen(true);
	}, [newThemeName, selectedBaseTheme, createFromBuiltIn]);

	const handleEdit = useCallback((theme: CustomTheme) => {
		setEditingTheme(theme);
		setEditorOpen(true);
	}, []);

	const handleSave = useCallback(
		(theme: CustomTheme) => {
			const exists = customThemes.some((t) => t.id === theme.id);
			if (exists) {
				updateCustomTheme(theme.id, theme);
			} else {
				addCustomTheme(theme);
			}
			setEditorOpen(false);
			setEditingTheme(null);
		},
		[customThemes, addCustomTheme, updateCustomTheme]
	);

	const handleDeleteClick = useCallback((theme: CustomTheme) => {
		setThemeToDelete(theme);
		setDeleteConfirmOpen(true);
	}, []);

	const handleDeleteConfirm = useCallback(() => {
		if (themeToDelete) {
			deleteCustomTheme(themeToDelete.id);
			setDeleteConfirmOpen(false);
			setThemeToDelete(null);
		}
	}, [themeToDelete, deleteCustomTheme]);

	const handleDuplicate = useCallback(
		(theme: CustomTheme) => {
			const duplicate = duplicateTheme(theme.id, `${theme.name} (copia)`);
			setEditingTheme(duplicate);
			setEditorOpen(true);
		},
		[duplicateTheme]
	);

	const handleImport = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const json = e.target?.result as string;
				const imported = importTheme(json);
				if (imported) {
					setImportDialogOpen(false);
					setEditingTheme(imported);
					setEditorOpen(true);
				}
			};
			reader.readAsText(file);
		},
		[importTheme]
	);

	const handleExport = useCallback(
		(themeId: string) => {
			const json = exportTheme(themeId);
			if (json) {
				const blob = new Blob([json], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `theme-${themeId}.json`;
				a.click();
				URL.revokeObjectURL(url);
			}
		},
		[exportTheme]
	);

	// Si el editor está abierto, mostrarlo a pantalla completa
	if (editorOpen) {
		return (
			<ThemeEditor
				onCancel={() => {
					setEditorOpen(false);
					setEditingTheme(null);
				}}
				onDelete={(id) => {
					const theme = customThemes.find((t) => t.id === id);
					if (theme) handleDeleteClick(theme);
				}}
				onSave={handleSave}
				theme={editingTheme}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<SettingsPageHeader
				description="Elige entre los temas predefinidos o crea variaciones propias optimizadas para distintos espacios de trabajo."
				title="Themes"
			/>

			{/* Tabs: Built-in / Custom */}
			<Tabs className="w-full" defaultValue="builtin">
				<TabsList className="mb-4 grid w-full max-w-xl grid-cols-2">
					<TabsTrigger className="gap-2" value="builtin">
						<Palette className="h-4 w-4" />
						Preset Themes
					</TabsTrigger>
					<TabsTrigger className="gap-2" value="custom">
						<Edit className="h-4 w-4" />
						My Themes ({customThemes.length})
					</TabsTrigger>
				</TabsList>

				{/* Built-in Themes */}
				<TabsContent className="mt-0" value="builtin">
					<SettingsCard
						color="var(--primary)"
						description="Choose one of the 14 included themes. Each is tuned for different lighting conditions and visual preferences."
						icon={<Palette />}
						title="System Themes"
					>
						{/* System preference option */}
						<button
							className={cn(
								'flex w-full items-center gap-3 rounded-lg border p-3 transition-all',
								activeTheme === 'system'
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
								<span className="font-medium text-foreground">Automatic</span>
								<p className="text-muted-foreground text-xs">
									Usar preferencia del sistema ({resolvedTheme === 'dark' ? 'oscuro' : 'claro'})
								</p>
							</div>
							{activeTheme === 'system' && (
								<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
									<Check className="h-3 w-3" />
								</div>
							)}
						</button>

						<Separator className="my-2" />

						{/* Theme grid */}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
							{BUILT_IN_THEMES.map((t) => {
								const Icon = t.icon === 'sun' ? Sun : t.icon === 'moon' ? Moon : Monitor;
								const isSelected = activeTheme === t.id;

								return (
									<button
										className={cn(
											'group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200',
											'hover:border-border/80 hover:bg-muted/50',
											isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-card'
										)}
										key={t.id}
										onClick={() => handleSelectBuiltIn(t.id)}
										type="button"
									>
										{/* Check indicator */}
										{isSelected && (
											<div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
												<Check className="h-3 w-3" />
											</div>
										)}

										{/* Theme preview circle */}
										<div
											className="flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110"
											style={{
												background: `linear-gradient(135deg, ${t.previewColor} 0%, color-mix(in oklch, ${t.previewColor} 70%, black) 100%)`,
												boxShadow: isSelected
													? `0 0 0 2px var(--primary), 0 4px 12px color-mix(in oklch, ${t.previewColor} 25%, transparent)`
													: 'none',
											}}
										>
											<Icon className="h-5 w-5" style={{ color: 'var(--background)' }} />
										</div>

										<span className={cn('font-medium text-sm', isSelected && 'text-primary')}>{t.name}</span>
										<span className="text-center text-muted-foreground text-xs leading-tight">{t.description}</span>
									</button>
								);
							})}
						</div>
					</SettingsCard>
				</TabsContent>

				{/* Custom Themes */}
				<TabsContent className="mt-0" value="custom">
					<SettingsCard
						color="var(--entity-character)"
						description="Create a unique theme by customizing each color. Start from any preset and make it your own."
						icon={<Edit />}
						title="Custom Themes"
					>
						{/* Actions bar */}
						<div className="flex flex-wrap items-center gap-2">
							{/* Create new */}
							<Dialog onOpenChange={setNewThemeDialogOpen} open={newThemeDialogOpen}>
								<DialogTrigger asChild>
									<Button className="gap-2" size="sm" variant="outline">
										<Plus className="h-4 w-4" />
										Create Theme
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Create New Theme</DialogTitle>
									</DialogHeader>
									<div className="flex flex-col gap-4 py-4">
										<div className="flex flex-col gap-2">
											<Label>Theme name</Label>
											<Input
												onChange={(e) => setNewThemeName(e.target.value)}
												placeholder="My custom theme"
												value={newThemeName}
											/>
										</div>
										<div className="flex flex-col gap-2">
											<Label>Basado en</Label>
											<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
												{BUILT_IN_THEMES.slice(0, 8).map((t) => (
													<button
														className={cn(
															'flex flex-col items-center gap-1 rounded-lg border p-2 transition-all',
															selectedBaseTheme === t.id
																? 'border-primary bg-primary/5'
																: 'border-border/50 hover:border-border'
														)}
														key={t.id}
														onClick={() => setSelectedBaseTheme(t.id)}
														type="button"
													>
														<div className="h-6 w-6 rounded-full" style={{ backgroundColor: t.previewColor }} />
														<span className="text-[10px]">{t.name}</span>
													</button>
												))}
											</div>
										</div>
										<Button className="mt-2" disabled={!newThemeName.trim()} onClick={handleCreateNew}>
											Create and Edit
										</Button>
									</div>
								</DialogContent>
							</Dialog>

							{/* Import */}
							<Dialog onOpenChange={setImportDialogOpen} open={importDialogOpen}>
								<DialogTrigger asChild>
									<Button className="gap-2" size="sm" variant="ghost">
										<Upload className="h-4 w-4" />
										Import
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Import Theme</DialogTitle>
									</DialogHeader>
									<div className="flex flex-col gap-4 py-4">
										<p className="text-muted-foreground text-sm">Select a previously exported theme JSON file.</p>
										<Input accept=".json" onChange={handleImport} type="file" />
									</div>
								</DialogContent>
							</Dialog>
						</div>

						{/* Custom themes list */}
						{customThemes.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
									<Palette className="h-8 w-8 text-muted-foreground" />
								</div>
								<div>
									<p className="font-medium text-foreground">Sin temas personalizados</p>
									<p className="text-muted-foreground text-sm">
										Create your first theme from scratch or use an existing theme as a starting point.
									</p>
								</div>
							</div>
						) : (
							<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
								{customThemes.map((theme) => (
									<div
										className="group flex h-full flex-col gap-3 rounded-lg border border-border/50 bg-card p-3 transition-all hover:border-border/80"
										key={theme.id}
									>
										{/* Theme preview strip */}
										<ThemeColorStrip colors={theme.colors} />

										{/* Info */}
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<h4 className="truncate font-medium text-sm">{theme.name}</h4>
												{theme.description && (
													<p className="truncate text-muted-foreground text-xs">{theme.description}</p>
												)}
												<p className="mt-1 text-[10px] text-muted-foreground">
													{theme.isDark ? 'Dark' : 'Light'} • Updated {new Date(theme.updatedAt).toLocaleDateString()}
												</p>
											</div>

											{/* Actions */}
											<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
												<Button
													className="h-7 w-7"
													onClick={() => handleSelectCustom(theme)}
													size="icon"
													variant="ghost"
												>
													<Check className="h-3.5 w-3.5" />
												</Button>
												<Button className="h-7 w-7" onClick={() => handleEdit(theme)} size="icon" variant="ghost">
													<Edit className="h-3.5 w-3.5" />
												</Button>
												<Button className="h-7 w-7" onClick={() => handleDuplicate(theme)} size="icon" variant="ghost">
													<Copy className="h-3.5 w-3.5" />
												</Button>
												<Button className="h-7 w-7" onClick={() => handleExport(theme.id)} size="icon" variant="ghost">
													<Download className="h-3.5 w-3.5" />
												</Button>
												<Button
													className="h-7 w-7 text-destructive hover:text-destructive"
													onClick={() => handleDeleteClick(theme)}
													size="icon"
													variant="ghost"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</SettingsCard>
				</TabsContent>
			</Tabs>

			{/* Delete confirmation dialog */}
			<Dialog onOpenChange={setDeleteConfirmOpen} open={deleteConfirmOpen}>
				<DialogContent>
					{themeToDelete && (
						<DeleteThemeConfirm
							onCancel={() => setDeleteConfirmOpen(false)}
							onConfirm={handleDeleteConfirm}
							themeName={themeToDelete.name}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
