import { Columns, Grid, LayoutGrid, List, Settings } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useViewConfiguration } from '../../../hooks/use-view-configuration';
import { ViewConfiguration, ViewPreset, ViewType } from '../../../types/file-browser/view-configuration';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Separator } from '../../ui/separator';
import { Slider } from '../../ui/slider';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

interface ViewConfigurationPanelProps {
	viewType: ViewType;
	onConfigurationChange?: (config: ViewConfiguration) => void;
	className?: string;
}

const VIEW_TYPE_ICONS = {
	list: List,
	grid: Grid,
	cards: LayoutGrid,
	masonry: Columns,
} as const;

const VIEW_TYPE_LABELS = {
	list: 'Lista',
	grid: 'Cuadrícula',
	cards: 'Tarjetas',
	masonry: 'Mosaico',
} as const;

export const ViewConfigurationPanel: React.FC<ViewConfigurationPanelProps> = ({
	viewType,
	onConfigurationChange,
	className = '',
}) => {
	const {
		currentConfiguration,
		updateConfiguration,
		availablePresets,
		saveAsPreset,
		applyPreset,
		exportConfiguration,
		importConfiguration,
	} = useViewConfiguration(viewType);

	const [currentConfig, setCurrentConfig] = useState<ViewConfiguration>(() => currentConfiguration);
	const [presets] = useState<ViewPreset[]>(() => availablePresets);
	const [isCreatingPreset, setIsCreatingPreset] = useState(false);
	const [presetName, setPresetName] = useState('');
	const [presetDescription, setPresetDescription] = useState('');

	const handleConfigChange = useCallback(
		(updates: Partial<ViewConfiguration>) => {
			const newConfig = { ...currentConfig, ...updates };
			setCurrentConfig(newConfig);
			updateConfiguration(updates);
			onConfigurationChange?.(newConfig);
		},
		[currentConfig, updateConfiguration, onConfigurationChange]
	);

	const handleCommonSettingChange = useCallback(
		(key: keyof ViewConfiguration['common'], value: any) => {
			handleConfigChange({
				common: {
					...currentConfig.common,
					[key]: value,
				},
			});
		},
		[currentConfig.common, handleConfigChange]
	);

	const handleSpecificSettingChange = useCallback(
		(key: string, value: any) => {
			handleConfigChange({
				specific: {
					...currentConfig.specific,
					[key]: value,
				},
			});
		},
		[currentConfig.specific, handleConfigChange]
	);

	const handlePresetApply = useCallback(
		async (preset: ViewPreset) => {
			const success = await applyPreset(preset.id);
			if (success) {
				setCurrentConfig(currentConfiguration);
				onConfigurationChange?.(currentConfiguration);
				toast.success(`Preset "${preset.name}" aplicado`);
			}
		},
		[applyPreset, currentConfiguration, onConfigurationChange]
	);

	const handleCreatePreset = useCallback(async () => {
		if (!presetName.trim()) {
			toast.error('El nombre del preset es requerido');
			return;
		}

		try {
			await saveAsPreset(presetName, presetDescription);

			setPresetName('');
			setPresetDescription('');
			setIsCreatingPreset(false);
			toast.success(`Preset "${presetName}" creado exitosamente`);
		} catch (error) {
			toast.error('Error al crear el preset');
		}
	}, [presetName, presetDescription, saveAsPreset]);

	const handleExport = useCallback(() => {
		try {
			const exported = exportConfiguration();
			const blob = new Blob([exported.data], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `view-config-${viewType}-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success('Configuración exportada');
		} catch (error) {
			toast.error('Error al exportar la configuración');
		}
	}, [viewType, exportConfiguration]);

	const handleImport = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) {
				return;
			}

			const reader = new FileReader();
			reader.onload = async (e) => {
				try {
					const content = e.target?.result as string;
					const result = await importConfiguration(content);
					if (result.success) {
						setCurrentConfig(currentConfiguration);
						onConfigurationChange?.(currentConfiguration);
						toast.success('Configuración importada exitosamente');
					} else {
						toast.error(`Error al importar: ${result.errors.join(', ')}`);
					}
				} catch (error) {
					toast.error('Error al importar la configuración');
				}
			};
			reader.readAsText(file);
		},
		[importConfiguration, currentConfiguration, onConfigurationChange]
	);

	const ViewIcon = VIEW_TYPE_ICONS[viewType];

	return (
		<Card className={`w-full max-w-4xl ${className}`}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ViewIcon className="h-5 w-5" />
					Configuración de Vista {VIEW_TYPE_LABELS[viewType]}
				</CardTitle>
				<CardDescription>
					Personaliza la apariencia y comportamiento de la vista {VIEW_TYPE_LABELS[viewType].toLowerCase()}
				</CardDescription>
			</CardHeader>

			<CardContent>
				<Tabs className="w-full" defaultValue="common">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="common">General</TabsTrigger>
						<TabsTrigger value="specific">Específico</TabsTrigger>
						<TabsTrigger value="presets">Presets</TabsTrigger>
						<TabsTrigger value="advanced">Avanzado</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-6" value="common">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div className="space-y-4">
								<h3 className="font-medium text-lg">Elementos Visibles</h3>

								<div className="flex items-center justify-between">
									<Label htmlFor="show-thumbnails">Mostrar miniaturas</Label>
									<Switch
										checked={currentConfig.common.showThumbnails}
										id="show-thumbnails"
										onCheckedChange={(checked) => handleCommonSettingChange('showThumbnails', checked)}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="show-metadata">Mostrar metadatos</Label>
									<Switch
										checked={currentConfig.common.showMetadata}
										id="show-metadata"
										onCheckedChange={(checked) => handleCommonSettingChange('showMetadata', checked)}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="show-tags">Mostrar etiquetas</Label>
									<Switch
										checked={currentConfig.common.showTags}
										id="show-tags"
										onCheckedChange={(checked) => handleCommonSettingChange('showTags', checked)}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="show-stats">Mostrar estadísticas</Label>
									<Switch
										checked={currentConfig.common.showStats}
										id="show-stats"
										onCheckedChange={(checked) => handleCommonSettingChange('showStats', checked)}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="show-hidden">Mostrar archivos ocultos</Label>
									<Switch
										checked={currentConfig.common.showHiddenFiles}
										id="show-hidden"
										onCheckedChange={(checked) => handleCommonSettingChange('showHiddenFiles', checked)}
									/>
								</div>
							</div>

							<div className="space-y-4">
								<h3 className="font-medium text-lg">Ordenamiento</h3>

								<div className="space-y-2">
									<Label htmlFor="sort-by">Ordenar por</Label>
									<Select
										onValueChange={(value) => handleCommonSettingChange('sortBy', value)}
										value={currentConfig.common.sortBy}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="name">Nombre</SelectItem>
											<SelectItem value="size">Tamaño</SelectItem>
											<SelectItem value="modified">Fecha modificación</SelectItem>
											<SelectItem value="created">Fecha creación</SelectItem>
											<SelectItem value="type">Tipo</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="sort-direction">Dirección</Label>
									<Select
										onValueChange={(value: 'asc' | 'desc') => handleCommonSettingChange('sortDirection', value)}
										value={currentConfig.common.sortDirection}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="asc">Ascendente</SelectItem>
											<SelectItem value="desc">Descendente</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

						<Separator />

						<div className="space-y-4">
							<h3 className="font-medium text-lg">Animaciones y Efectos</h3>

							<div className="flex items-center justify-between">
								<Label htmlFor="enable-animations">Habilitar animaciones</Label>
								<Switch
									checked={currentConfig.common.enableAnimations}
									id="enable-animations"
									onCheckedChange={(checked) => handleCommonSettingChange('enableAnimations', checked)}
								/>
							</div>

							{currentConfig.common.enableAnimations && (
								<div className="space-y-2">
									<Label htmlFor="animation-duration">
										Duración de animación: {currentConfig.common.animationDuration}ms
									</Label>
									<Slider
										className="w-full"
										id="animation-duration"
										max={1000}
										min={0}
										onValueChange={([value]) => handleCommonSettingChange('animationDuration', value)}
										step={50}
										value={[currentConfig.common.animationDuration]}
									/>
								</div>
							)}

							<div className="flex items-center justify-between">
								<Label htmlFor="hover-effects">Efectos de hover</Label>
								<Switch
									checked={currentConfig.common.enableHoverEffects}
									id="hover-effects"
									onCheckedChange={(checked) => handleCommonSettingChange('enableHoverEffects', checked)}
								/>
							</div>
						</div>
					</TabsContent>

					<TabsContent className="space-y-6" value="specific">
						<div className="py-8 text-center">
							<Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="mb-2 font-medium text-lg">Configuración Específica de {VIEW_TYPE_LABELS[viewType]}</h3>
							<p className="text-muted-foreground">
								Las opciones específicas para la vista {VIEW_TYPE_LABELS[viewType].toLowerCase()} aparecerán aquí.
							</p>
						</div>
					</TabsContent>

					<TabsContent className="space-y-6" value="presets">
						<div className="flex items-center justify-between">
							<h3 className="font-medium text-lg">Presets Disponibles</h3>
							<Button onClick={() => setIsCreatingPreset(true)} size="sm" variant="outline">
								Crear Preset
							</Button>
						</div>

						{isCreatingPreset && (
							<Card>
								<CardHeader>
									<CardTitle>Crear Nuevo Preset</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="preset-name">Nombre</Label>
										<Input
											id="preset-name"
											onChange={(e) => setPresetName(e.target.value)}
											placeholder="Nombre del preset"
											value={presetName}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="preset-description">Descripción (opcional)</Label>
										<Input
											id="preset-description"
											onChange={(e) => setPresetDescription(e.target.value)}
											placeholder="Descripción del preset"
											value={presetDescription}
										/>
									</div>

									<div className="flex gap-2">
										<Button onClick={handleCreatePreset}>Crear</Button>
										<Button
											onClick={() => {
												setIsCreatingPreset(false);
												setPresetName('');
												setPresetDescription('');
											}}
											variant="outline"
										>
											Cancelar
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{presets.map((preset) => (
								<Card className="cursor-pointer transition-shadow hover:shadow-md" key={preset.id}>
									<CardHeader className="pb-2">
										<div className="flex items-center justify-between">
											<CardTitle className="text-base">{preset.name}</CardTitle>
											<Badge variant={preset.category === 'custom' ? 'secondary' : 'default'}>{preset.category}</Badge>
										</div>
										{preset.description && <CardDescription className="text-sm">{preset.description}</CardDescription>}
									</CardHeader>
									<CardContent>
										<Button className="w-full" onClick={() => handlePresetApply(preset)} size="sm" variant="outline">
											Aplicar
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent className="space-y-6" value="advanced">
						<div className="space-y-4">
							<h3 className="font-medium text-lg">Importar/Exportar</h3>

							<div className="flex gap-2">
								<Button onClick={handleExport} variant="outline">
									Exportar Configuración
								</Button>

								<div className="relative">
									<Button asChild variant="outline">
										<label className="cursor-pointer" htmlFor="import-config">
											Importar Configuración
										</label>
									</Button>
									<input
										accept=".json"
										className="absolute inset-0 cursor-pointer opacity-0"
										id="import-config"
										onChange={handleImport}
										type="file"
									/>
								</div>
							</div>
						</div>

						<Separator />

						<div className="space-y-4">
							<h3 className="font-medium text-lg">Información de Configuración</h3>

							<div className="space-y-2 rounded-lg bg-muted p-4">
								<div className="flex justify-between">
									<span className="font-medium">Nombre:</span>
									<span>{currentConfig.metadata.name}</span>
								</div>

								<div className="flex justify-between">
									<span className="font-medium">Versión:</span>
									<span>{currentConfig.metadata.version}</span>
								</div>

								<div className="flex justify-between">
									<span className="font-medium">Creado:</span>
									<span>{new Date(currentConfig.metadata.createdAt).toLocaleDateString()}</span>
								</div>

								<div className="flex justify-between">
									<span className="font-medium">Modificado:</span>
									<span>{new Date(currentConfig.metadata.lastModified).toLocaleDateString()}</span>
								</div>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
};

export default ViewConfigurationPanel;
