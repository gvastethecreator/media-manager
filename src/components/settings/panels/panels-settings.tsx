/**
 * @file Panels Settings
 * @module components/settings/panels/panels-settings
 * @description Configuración de paneles laterales y layout de la interfaz
 */

import { ChevronRight, Layout, Maximize2, PanelLeft, PanelRight, RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider-v3';
import { Switch } from '@/components/ui/switch-v3';
import { toastService } from '@/lib/ui/toast';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';
import { SettingsCard, SettingsGroup, SettingsRow } from '../modern/settings-card';

interface PanelConfig {
	leftPanel: {
		visible: boolean;
		width: number;
		collapsible: boolean;
		defaultCollapsed: boolean;
	};
	rightPanel: {
		visible: boolean;
		width: number;
		collapsible: boolean;
		defaultCollapsed: boolean;
	};
	toolbar: {
		visible: boolean;
		position: 'top' | 'bottom';
		sticky: boolean;
	};
	breadcrumbs: {
		visible: boolean;
		showHome: boolean;
		maxItems: number;
	};
}

const defaultPanelConfig: PanelConfig = {
	leftPanel: {
		visible: true,
		width: 280,
		collapsible: true,
		defaultCollapsed: false,
	},
	rightPanel: {
		visible: true,
		width: 320,
		collapsible: true,
		defaultCollapsed: true,
	},
	toolbar: {
		visible: true,
		position: 'top',
		sticky: true,
	},
	breadcrumbs: {
		visible: true,
		showHome: true,
		maxItems: 5,
	},
};

export function PanelsSettings() {
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s) => s.setPreferences);

	// Panel configuration state (stored in preferences.panels)
	const [panelConfig, setPanelConfig] = useState<PanelConfig>(() => {
		const stored = (preferences as any)?.panels;
		return stored ? { ...defaultPanelConfig, ...stored } : defaultPanelConfig;
	});

	const [hasChanges, setHasChanges] = useState(false);

	const updateConfig = <K extends keyof PanelConfig>(section: K, updates: Partial<PanelConfig[K]>) => {
		setPanelConfig((prev) => ({
			...prev,
			[section]: { ...prev[section], ...updates },
		}));
		setHasChanges(true);
	};

	const handleSave = () => {
		setPreferences({ panels: panelConfig } as any);
		setHasChanges(false);
		toastService.success('Configuración de paneles guardada');
	};

	const handleReset = () => {
		setPanelConfig(defaultPanelConfig);
		setPreferences({ panels: defaultPanelConfig } as any);
		setHasChanges(false);
		toastService.info('Configuración de paneles restaurada');
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-2xl text-foreground">Configuración de Paneles</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						Personaliza el layout de los paneles laterales y la barra de herramientas
					</p>
				</div>
				<div className="flex gap-2">
					<Button className="gap-2" disabled={!hasChanges} onClick={handleReset} size="sm" variant="outline">
						<RotateCcw className="h-4 w-4" />
						Restaurar
					</Button>
					<Button className="gap-2" disabled={!hasChanges} onClick={handleSave} size="sm">
						<Save className="h-4 w-4" />
						Guardar
					</Button>
				</div>
			</div>

			{/* Panel Izquierdo (Navegación) */}
			<SettingsCard
				color="var(--entity-folder)"
				description="Configura el panel de navegación lateral izquierdo"
				icon={<PanelLeft />}
				title="Panel de Navegación"
			>
				<SettingsGroup title="Visibilidad">
					<SettingsRow description="Mostrar el panel de navegación en la interfaz" label="Panel visible">
						<Switch
							checked={panelConfig.leftPanel.visible}
							onCheckedChange={(checked) => updateConfig('leftPanel', { visible: checked })}
						/>
					</SettingsRow>

					<SettingsRow description="Permitir colapsar el panel para ganar espacio" label="Permitir colapsar">
						<Switch
							checked={panelConfig.leftPanel.collapsible}
							disabled={!panelConfig.leftPanel.visible}
							onCheckedChange={(checked) => updateConfig('leftPanel', { collapsible: checked })}
						/>
					</SettingsRow>

					<SettingsRow description="El panel inicia colapsado al abrir la aplicación" label="Iniciar colapsado">
						<Switch
							checked={panelConfig.leftPanel.defaultCollapsed}
							disabled={!panelConfig.leftPanel.collapsible}
							onCheckedChange={(checked) => updateConfig('leftPanel', { defaultCollapsed: checked })}
						/>
					</SettingsRow>
				</SettingsGroup>

				<SettingsGroup title="Dimensiones">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm">Ancho del panel: {panelConfig.leftPanel.width}px</Label>
							<span className="text-muted-foreground text-xs">
								{panelConfig.leftPanel.width < 250
									? 'Compacto'
									: panelConfig.leftPanel.width > 350
										? 'Amplio'
										: 'Normal'}
							</span>
						</div>
						<Slider
							className="w-full"
							disabled={!panelConfig.leftPanel.visible}
							max={400}
							min={200}
							onValueChange={([value]) => updateConfig('leftPanel', { width: value })}
							step={10}
							value={[panelConfig.leftPanel.width]}
						/>
						<div className="flex justify-between text-muted-foreground text-xs">
							<span>200px</span>
							<span>400px</span>
						</div>
					</div>
				</SettingsGroup>
			</SettingsCard>

			{/* Panel Derecho (Detalles) */}
			<SettingsCard
				color="var(--entity-image)"
				description="Configura el panel de detalles lateral derecho"
				icon={<PanelRight />}
				title="Panel de Detalles"
			>
				<SettingsGroup title="Visibilidad">
					<SettingsRow description="Mostrar el panel de detalles en la interfaz" label="Panel visible">
						<Switch
							checked={panelConfig.rightPanel.visible}
							onCheckedChange={(checked) => updateConfig('rightPanel', { visible: checked })}
						/>
					</SettingsRow>

					<SettingsRow description="Permitir colapsar el panel para ganar espacio" label="Permitir colapsar">
						<Switch
							checked={panelConfig.rightPanel.collapsible}
							disabled={!panelConfig.rightPanel.visible}
							onCheckedChange={(checked) => updateConfig('rightPanel', { collapsible: checked })}
						/>
					</SettingsRow>

					<SettingsRow description="El panel inicia colapsado al abrir la aplicación" label="Iniciar colapsado">
						<Switch
							checked={panelConfig.rightPanel.defaultCollapsed}
							disabled={!panelConfig.rightPanel.collapsible}
							onCheckedChange={(checked) => updateConfig('rightPanel', { defaultCollapsed: checked })}
						/>
					</SettingsRow>
				</SettingsGroup>

				<SettingsGroup title="Dimensiones">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm">Ancho del panel: {panelConfig.rightPanel.width}px</Label>
							<span className="text-muted-foreground text-xs">
								{panelConfig.rightPanel.width < 280
									? 'Compacto'
									: panelConfig.rightPanel.width > 380
										? 'Amplio'
										: 'Normal'}
							</span>
						</div>
						<Slider
							className="w-full"
							disabled={!panelConfig.rightPanel.visible}
							max={500}
							min={250}
							onValueChange={([value]) => updateConfig('rightPanel', { width: value })}
							step={10}
							value={[panelConfig.rightPanel.width]}
						/>
						<div className="flex justify-between text-muted-foreground text-xs">
							<span>250px</span>
							<span>500px</span>
						</div>
					</div>
				</SettingsGroup>
			</SettingsCard>

			{/* Barra de Herramientas */}
			<SettingsCard
				color="var(--primary)"
				description="Configura la barra de herramientas superior"
				icon={<Layout />}
				title="Barra de Herramientas"
			>
				<SettingsRow description="Mostrar la barra de herramientas principal" label="Barra visible">
					<Switch
						checked={panelConfig.toolbar.visible}
						onCheckedChange={(checked) => updateConfig('toolbar', { visible: checked })}
					/>
				</SettingsRow>

				<SettingsRow description="La barra permanece fija al hacer scroll" label="Barra fija (sticky)">
					<Switch
						checked={panelConfig.toolbar.sticky}
						disabled={!panelConfig.toolbar.visible}
						onCheckedChange={(checked) => updateConfig('toolbar', { sticky: checked })}
					/>
				</SettingsRow>

				<SettingsRow description="Posición de la barra de herramientas" label="Posición">
					<Select
						disabled={!panelConfig.toolbar.visible}
						onValueChange={(value) => updateConfig('toolbar', { position: value as 'top' | 'bottom' })}
						value={panelConfig.toolbar.position}
					>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="top">Arriba</SelectItem>
							<SelectItem value="bottom">Abajo</SelectItem>
						</SelectContent>
					</Select>
				</SettingsRow>
			</SettingsCard>

			{/* Breadcrumbs */}
			<SettingsCard
				color="var(--muted-foreground)"
				description="Configura la navegación por migas de pan"
				icon={<ChevronRight />}
				title="Breadcrumbs"
			>
				<SettingsRow description="Mostrar la ruta de navegación actual" label="Breadcrumbs visibles">
					<Switch
						checked={panelConfig.breadcrumbs.visible}
						onCheckedChange={(checked) => updateConfig('breadcrumbs', { visible: checked })}
					/>
				</SettingsRow>

				<SettingsRow description="Incluir enlace al inicio en el breadcrumb" label="Mostrar inicio">
					<Switch
						checked={panelConfig.breadcrumbs.showHome}
						disabled={!panelConfig.breadcrumbs.visible}
						onCheckedChange={(checked) => updateConfig('breadcrumbs', { showHome: checked })}
					/>
				</SettingsRow>

				<SettingsRow description="Número máximo de elementos visibles" label="Máximo de items">
					<Select
						disabled={!panelConfig.breadcrumbs.visible}
						onValueChange={(value) => updateConfig('breadcrumbs', { maxItems: Number.parseInt(value, 10) })}
						value={String(panelConfig.breadcrumbs.maxItems)}
					>
						<SelectTrigger className="w-24">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="3">3</SelectItem>
							<SelectItem value="4">4</SelectItem>
							<SelectItem value="5">5</SelectItem>
							<SelectItem value="6">6</SelectItem>
							<SelectItem value="8">8</SelectItem>
						</SelectContent>
					</Select>
				</SettingsRow>
			</SettingsCard>

			{/* Preview Visual */}
			<SettingsCard
				color="var(--primary)"
				description="Vista previa del layout configurado"
				icon={<Maximize2 />}
				title="Vista Previa"
			>
				<div className="rounded-lg border border-border/50 bg-muted/30 p-4">
					<div className="flex h-48 gap-2 rounded border border-border/50 border-dashed bg-background p-2">
						{/* Left Panel Preview */}
						{panelConfig.leftPanel.visible && (
							<div
								className="flex shrink-0 flex-col items-center justify-center rounded bg-muted/50 text-muted-foreground text-xs"
								style={{
									width: panelConfig.leftPanel.defaultCollapsed ? 40 : Math.min(panelConfig.leftPanel.width / 4, 80),
								}}
							>
								<PanelLeft className="mb-1 h-4 w-4" />
								{!panelConfig.leftPanel.defaultCollapsed && <span>Nav</span>}
							</div>
						)}

						{/* Main Content Preview */}
						<div className="flex flex-1 flex-col gap-1">
							{panelConfig.toolbar.visible && panelConfig.toolbar.position === 'top' && (
								<div className="flex h-6 items-center justify-center rounded bg-primary/10 text-muted-foreground text-xs">
									Toolbar
								</div>
							)}
							{panelConfig.breadcrumbs.visible && (
								<div className="flex h-4 items-center gap-1 px-1 text-[10px] text-muted-foreground">
									{panelConfig.breadcrumbs.showHome && <span>🏠</span>}
									<ChevronRight className="h-2 w-2" />
									<span>Carpeta</span>
									<ChevronRight className="h-2 w-2" />
									<span>...</span>
								</div>
							)}
							<div className="flex flex-1 items-center justify-center rounded bg-muted/30 text-muted-foreground text-xs">
								Contenido Principal
							</div>
							{panelConfig.toolbar.visible && panelConfig.toolbar.position === 'bottom' && (
								<div className="flex h-6 items-center justify-center rounded bg-primary/10 text-muted-foreground text-xs">
									Toolbar
								</div>
							)}
						</div>

						{/* Right Panel Preview */}
						{panelConfig.rightPanel.visible && (
							<div
								className="flex shrink-0 flex-col items-center justify-center rounded bg-muted/50 text-muted-foreground text-xs"
								style={{
									width: panelConfig.rightPanel.defaultCollapsed ? 40 : Math.min(panelConfig.rightPanel.width / 4, 100),
								}}
							>
								<PanelRight className="mb-1 h-4 w-4" />
								{!panelConfig.rightPanel.defaultCollapsed && <span>Detalles</span>}
							</div>
						)}
					</div>
				</div>
			</SettingsCard>
		</div>
	);
}
