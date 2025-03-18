'use client';

/**
 * 🌈 Panel de presets de capas
 *
 * Este componente proporciona una interfaz para seleccionar, aplicar y gestionar
 * presets de capas para diferentes tipos de tarjetas de entidad.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckIcon, SaveIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import type { EntityCardLayerSystemConfig } from './entity-card-layer-adapter';
import type { LayerPreset } from './layer-presets';
import { useLayerPresets } from './use-layer-presets';

export interface LayerPresetsPanelProps {
	entityType: string;
	currentConfig: EntityCardLayerSystemConfig;
	onApplyPreset: (config: EntityCardLayerSystemConfig) => void;
	className?: string;
}

/**
 * Panel para seleccionar y gestionar presets de capas
 */
export function LayerPresetsPanel({ entityType, currentConfig, onApplyPreset, className }: LayerPresetsPanelProps) {
	const {
		filteredPresets,
		customPresets,
		selectedPresetId,
		selectPreset,
		applySelectedPreset,
		saveCurrentAsPreset,
		deleteCustomPreset,
		getCategoryPresets,
	} = useLayerPresets(entityType);

	// Estado para el diálogo de guardar preset
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [newPresetName, setNewPresetName] = useState('');
	const [newPresetDescription, setNewPresetDescription] = useState('');
	const [newPresetEntityTypes, setNewPresetEntityTypes] = useState<string[]>([entityType]);

	// Manejar la aplicación de un preset
	const handleApplyPreset = () => {
		if (!selectedPresetId) return;

		try {
			const newConfig = applySelectedPreset(currentConfig);
			onApplyPreset(newConfig);
		} catch (error) {
			console.error('Error al aplicar preset:', error);
		}
	};

	// Manejar guardar un nuevo preset
	const handleSavePreset = () => {
		if (!newPresetName.trim()) return;

		saveCurrentAsPreset(newPresetName, newPresetDescription, newPresetEntityTypes, currentConfig);

		// Limpiar formulario y cerrar diálogo
		setNewPresetName('');
		setNewPresetDescription('');
		setSaveDialogOpen(false);
	};

	// Obtener presets por categoría
	const basicPresets = getCategoryPresets('basic');
	const advancedPresets = getCategoryPresets('advanced');
	const specialPresets = getCategoryPresets('special');

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle>Presets de Capas</CardTitle>
				<CardDescription>Selecciona un estilo predefinido para aplicar a tu tarjeta</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="basic" className="w-full">
					<TabsList className="grid grid-cols-4 mb-4">
						<TabsTrigger value="basic">Básicos</TabsTrigger>
						<TabsTrigger value="advanced">Avanzados</TabsTrigger>
						<TabsTrigger value="special">Especiales</TabsTrigger>
						<TabsTrigger value="custom">Personalizados</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4">
						<ScrollArea className="h-[300px] pr-4">
							<div className="grid grid-cols-2 gap-4">
								{basicPresets.map((preset) => (
									<PresetCard
										key={preset.id}
										preset={preset}
										isSelected={selectedPresetId === preset.id}
										onSelect={() => selectPreset(preset.id)}
										onDelete={undefined}
									/>
								))}
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="advanced" className="space-y-4">
						<ScrollArea className="h-[300px] pr-4">
							<div className="grid grid-cols-2 gap-4">
								{advancedPresets.map((preset) => (
									<PresetCard
										key={preset.id}
										preset={preset}
										isSelected={selectedPresetId === preset.id}
										onSelect={() => selectPreset(preset.id)}
										onDelete={undefined}
									/>
								))}
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="special" className="space-y-4">
						<ScrollArea className="h-[300px] pr-4">
							<div className="grid grid-cols-2 gap-4">
								{specialPresets.map((preset) => (
									<PresetCard
										key={preset.id}
										preset={preset}
										isSelected={selectedPresetId === preset.id}
										onSelect={() => selectPreset(preset.id)}
										onDelete={undefined}
									/>
								))}
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="custom" className="space-y-4">
						<ScrollArea className="h-[300px] pr-4">
							<div className="grid grid-cols-2 gap-4">
								{customPresets.length > 0 ? (
									customPresets.map((preset) => (
										<PresetCard
											key={preset.id}
											preset={preset}
											isSelected={selectedPresetId === preset.id}
											onSelect={() => selectPreset(preset.id)}
											onDelete={() => deleteCustomPreset(preset.id)}
										/>
									))
								) : (
									<div className="col-span-2 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
										<p>No tienes presets personalizados guardados.</p>
										<p className="mt-2">Guarda la configuración actual como un preset para usarla más tarde.</p>
									</div>
								)}
							</div>
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</CardContent>
			<CardFooter className="flex justify-between">
				<Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm">
							<SaveIcon className="mr-2 h-4 w-4" />
							Guardar Actual
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Guardar Preset Personalizado</DialogTitle>
							<DialogDescription>
								Guarda la configuración actual como un preset personalizado para usarla más tarde.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="preset-name">Nombre</Label>
								<Input
									id="preset-name"
									value={newPresetName}
									onChange={(e) => setNewPresetName(e.target.value)}
									placeholder="Mi preset personalizado"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="preset-description">Descripción</Label>
								<Textarea
									id="preset-description"
									value={newPresetDescription}
									onChange={(e) => setNewPresetDescription(e.target.value)}
									placeholder="Describe tu preset personalizado..."
									rows={3}
								/>
							</div>
							<div className="grid gap-2">
								<Label>Tipos de Entidad</Label>
								<div className="flex flex-wrap gap-2">
									{['image', 'folder', 'album', 'tag', 'collection'].map((type) => (
										<Button
											key={type}
											type="button"
											variant={newPresetEntityTypes.includes(type) ? 'default' : 'outline'}
											size="sm"
											onClick={() => {
												setNewPresetEntityTypes((prev) =>
													prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
												);
											}}
										>
											{type}
										</Button>
									))}
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={handleSavePreset} disabled={!newPresetName.trim()}>
								Guardar Preset
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Button onClick={handleApplyPreset} disabled={!selectedPresetId}>
					Aplicar Preset
				</Button>
			</CardFooter>
		</Card>
	);
}

/**
 * Tarjeta para mostrar un preset
 */
function PresetCard({
	preset,
	isSelected,
	onSelect,
	onDelete,
}: {
	preset: LayerPreset;
	isSelected: boolean;
	onSelect: () => void;
	onDelete?: () => void;
}) {
	return (
		<button
			type="button"
			className={cn(
				'relative p-4 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors text-left w-full',
				isSelected && 'border-primary bg-primary/5'
			)}
			onClick={onSelect}
			aria-pressed={isSelected}
		>
			{isSelected && (
				<div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
					<CheckIcon className="h-3 w-3" />
				</div>
			)}

			<div className="mb-2">
				<h3 className="font-medium text-sm">{preset.name}</h3>
				<p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
			</div>

			<div className="flex flex-wrap gap-1 mt-2">
				{preset.entityTypes.map((type) => (
					<span key={type} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold">
						{type}
					</span>
				))}
			</div>

			{onDelete && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute bottom-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
				>
					<TrashIcon className="h-3 w-3" />
				</Button>
			)}
		</button>
	);
}
