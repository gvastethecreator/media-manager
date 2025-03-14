'use client';

import { adaptBaseToSettingsOptions } from '@/components/features/entity-cards/base/card-adapter';
import { DEFAULT_SETTINGS_OPTIONS } from '@/components/features/entity-cards/config/card-config-defaults';
import {
	createPresetFromCardOptions,
	getVisualPresetsByEntityType,
} from '@/components/features/entity-cards/server-actions/visual-presets.actions';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { VisualPreset } from '@prisma/client';
import { Info, LayoutTemplate, PlusCircle, Save, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { EntityCardPreview } from '../preview/entity-card-preview';

// 🎨 Esquema de colores para el panel de presets
const presetsColors = {
	bg: 'bg-teal-500/5',
	border: 'border-teal-500/20',
	text: 'text-teal-600',
	highlight: 'bg-teal-500/10',
	hover: 'hover:bg-teal-500/10',
};

/**
 * Props para el componente PresetsPanel
 */
interface PresetsPanelProps {
	activePreset: string | null;
	onPresetSelect: (preset: { id: string; name: string; options: CardOptions }) => void;
	entityType?: string;
	cardOptions?: CardOptions;
}

/**
 * Panel de selección de presets para configuraciones de tarjetas
 * @component
 */
export function PresetsPanel({ activePreset, onPresetSelect, entityType = 'album', cardOptions }: PresetsPanelProps) {
	const { toast } = useToast();
	const [presets, setPresets] = useState<VisualPreset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [newPresetName, setNewPresetName] = useState('');
	const [newPresetDescription, setNewPresetDescription] = useState('');
	const [showNewPresetDialog, setShowNewPresetDialog] = useState(false);

	// Cargar presets al iniciar
	useEffect(() => {
		async function loadPresets() {
			setLoading(true);
			setError(null);
			try {
				const response = await getVisualPresetsByEntityType(entityType);
				if (response.success && response.data) {
					setPresets(response.data as VisualPreset[]);
				} else {
					setError(response.message);
					toast({
						title: 'Error',
						description: 'No se pudieron cargar los presets',
						variant: 'destructive',
					});
				}
			} catch (_err) {
				setError('Error al cargar presets');
				toast({
					title: 'Error',
					description: 'Ocurrió un problema al cargar los presets',
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		}

		loadPresets();
	}, [entityType, toast]);

	// Función para crear un nuevo preset a partir de las opciones actuales
	const handleCreatePreset = async () => {
		if (!newPresetName.trim()) {
			toast({
				title: 'Error',
				description: 'El nombre del preset es obligatorio',
				variant: 'destructive',
			});
			return;
		}

		setIsSaving(true);
		try {
			// Usar las opciones actuales o las predeterminadas
			const options = cardOptions || adaptBaseToSettingsOptions(DEFAULT_SETTINGS_OPTIONS);

			const response = await createPresetFromCardOptions(
				newPresetName.trim(),
				options,
				entityType,
				newPresetDescription.trim() || undefined
			);

			if (response.success && response.data) {
				toast({
					title: 'Éxito',
					description: 'Preset creado correctamente',
				});

				// Actualizar la lista de presets
				const newPreset = response.data as VisualPreset;
				setPresets((prevPresets) => [...prevPresets, newPreset]);

				// Limpiar el formulario
				setNewPresetName('');
				setNewPresetDescription('');
				setShowNewPresetDialog(false);
			} else {
				toast({
					title: 'Error',
					description: response.message || 'No se pudo crear el preset',
					variant: 'destructive',
				});
			}
		} catch (_err) {
			toast({
				title: 'Error',
				description: 'Ocurrió un problema al crear el preset',
				variant: 'destructive',
			});
		} finally {
			setIsSaving(false);
		}
	};

	// Función para seleccionar un preset
	const handleSelectPreset = async (preset: VisualPreset) => {
		try {
			// Convertir el preset a opciones de tarjeta
			const options = adaptBaseToSettingsOptions({
				coreConfig: preset.coreConfig ? JSON.parse(preset.coreConfig) : {},
				designConfig: preset.designConfig ? JSON.parse(preset.designConfig) : {},
				animationConfig: preset.animationConfig ? JSON.parse(preset.animationConfig) : {},
				layerConfig: preset.layerConfig ? JSON.parse(preset.layerConfig) : {},
				effectsConfig: preset.effectsConfig ? JSON.parse(preset.effectsConfig) : {},
				// Incluir otras configuraciones...
			});

			// Llamar al callback con las opciones adaptadas
			onPresetSelect({
				id: preset.id,
				name: preset.name,
				options,
			});
		} catch (_err) {
			toast({
				title: 'Error',
				description: 'Ocurrió un problema al aplicar el preset',
				variant: 'destructive',
			});
		}
	};

	// Mostrar mensaje de carga
	if (loading) {
		return (
			<div className={cn('p-4 rounded-lg border', presetsColors.border, presetsColors.bg)}>
				<p className="text-center text-sm text-muted-foreground">Cargando presets...</p>
			</div>
		);
	}

	// Mostrar mensaje de error
	if (error) {
		return (
			<div className={cn('p-4 rounded-lg border border-destructive/30 bg-destructive/5')}>
				<p className="text-center text-sm text-destructive">{error}</p>
				<Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => window.location.reload()}>
					Reintentar
				</Button>
			</div>
		);
	}

	return (
		<div className={cn('p-4 rounded-lg border', presetsColors.border, presetsColors.bg)}>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className={cn('text-lg font-medium flex items-center gap-2', presetsColors.text)}>
						<LayoutTemplate size={18} />
						Presets Visuales
					</h3>
					<p className="text-sm text-muted-foreground">Configuraciones predefinidas para el estilo visual</p>
				</div>
				<div className="flex items-center gap-2">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShowNewPresetDialog(true)}>
									<PlusCircle className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left">
								<p className="text-xs">Crear nuevo preset</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="text-muted-foreground hover:text-primary"
									onClick={() =>
										toast({
											title: 'Información',
											description:
												'Los presets te permiten guardar y reutilizar configuraciones visuales para tus entidades.',
										})
									}
									type="button"
								>
									<Info size={16} />
								</button>
							</TooltipTrigger>
							<TooltipContent side="left">
								<p className="text-xs">Selecciona un preset como punto de partida</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			{/* Grid de presets */}
			{presets.length > 0 ? (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					{presets.map((preset) => (
						<PresetCard
							key={preset.id}
							preset={preset}
							isActive={activePreset === preset.id}
							onClick={() => handleSelectPreset(preset)}
							entityType={entityType}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-8">
					<p className="text-muted-foreground mb-4">No hay presets disponibles para este tipo de entidad</p>
					<Button variant="outline" onClick={() => setShowNewPresetDialog(true)} className="gap-2">
						<PlusCircle className="h-4 w-4" />
						Crear el primer preset
					</Button>
				</div>
			)}

			{/* Diálogo para crear nuevo preset */}
			<Dialog open={showNewPresetDialog} onOpenChange={setShowNewPresetDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Crear nuevo preset visual</DialogTitle>
						<DialogDescription>
							Guarda la configuración actual como un preset para reutilizarla más adelante.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="preset-name">Nombre del preset</Label>
							<Input
								id="preset-name"
								placeholder="Ej: Estilo Holográfico"
								value={newPresetName}
								onChange={(e) => setNewPresetName(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="preset-description">Descripción (opcional)</Label>
							<Input
								id="preset-description"
								placeholder="Ej: Tarjetas con efecto holográfico para álbumes"
								value={newPresetDescription}
								onChange={(e) => setNewPresetDescription(e.target.value)}
							/>
						</div>

						{/* Vista previa */}
						<div className="pt-4">
							<p className="text-sm font-medium mb-2">Vista previa</p>
							<div className="h-52 flex items-center justify-center bg-muted/30 rounded-md">
								<div className="w-40">
									<EntityCardPreview
										cardOptions={cardOptions || adaptBaseToSettingsOptions(DEFAULT_SETTINGS_OPTIONS)}
										entityType={entityType}
									/>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">Cancelar</Button>
						</DialogClose>
						<Button onClick={handleCreatePreset} disabled={isSaving || !newPresetName.trim()} className="gap-2">
							{isSaving ? (
								<>Guardando...</>
							) : (
								<>
									<Save className="h-4 w-4" />
									Guardar preset
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

/**
 * Props para el componente PresetCard
 */
interface PresetCardProps {
	preset: VisualPreset;
	isActive: boolean;
	onClick: () => void;
	entityType: string;
}

/**
 * Tarjeta individual que muestra un preset con vista previa
 * @component
 */
function PresetCard({ preset, isActive, onClick, entityType }: PresetCardProps) {
	// Convertir el preset a opciones de tarjeta para la vista previa
	const presetOptions = React.useMemo(() => {
		try {
			return adaptBaseToSettingsOptions({
				coreConfig: preset.coreConfig ? JSON.parse(preset.coreConfig) : {},
				designConfig: preset.designConfig ? JSON.parse(preset.designConfig) : {},
				// Incluir otras configuraciones según necesidad
			});
		} catch (err) {
			console.error('Error al parsear opciones del preset:', err);
			return adaptBaseToSettingsOptions(DEFAULT_SETTINGS_OPTIONS);
		}
	}, [preset]);

	return (
		<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-full">
			<Card
				className={cn(
					'cursor-pointer transition-all overflow-hidden h-full border-2',
					isActive ? `${presetsColors.border} ${presetsColors.highlight}` : 'border-transparent'
				)}
				onClick={onClick}
			>
				<div className="h-32 overflow-hidden relative bg-muted/30">
					<div className="scale-75 origin-top absolute inset-0">
						<EntityCardPreview entityType={entityType} cardOptions={presetOptions} showBackside={false} />
					</div>
				</div>
				<CardContent className="p-3">
					<div className="flex items-center gap-2 mb-1">
						{preset.isDefault && <Sparkles size={14} className="text-yellow-500" />}
						<h4 className="text-sm font-medium truncate">{preset.name}</h4>
					</div>
					{preset.description && <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>}
				</CardContent>
			</Card>
		</motion.div>
	);
}
