'use client';

import {
	getCardOptionsFromPreset,
	getVisualPresetsByEntityType,
} from '@/components/features/entity-cards/actions/visual-presets.actions';
import { applyPresetToEntity } from '@/components/features/entity-cards/modules/core/actions/entities-cards.actions';
import { EntityCardPreview } from '@/components/features/entity-cards/modules/preview/entity-card-preview';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { VisualPreset } from '@prisma/client';
import { Check, ChevronDown, Paintbrush, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface EntityPresetSelectorProps {
	entityId: string;
	entityType: string;
	currentPresetId: string | null;
	defaultOptions: CardOptions;
	onPresetChange?: (presetId: string | null, options: CardOptions) => void;
	className?: string;
}

/**
 * Componente para seleccionar presets visuales para una entidad
 */
export function EntityPresetSelector({
	entityId,
	entityType,
	currentPresetId,
	defaultOptions,
	onPresetChange,
	className,
}: EntityPresetSelectorProps) {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [open, setOpen] = useState(false);
	const [presets, setPresets] = useState<VisualPreset[]>([]);
	const [selectedPresetId, setSelectedPresetId] = useState<string | null>(currentPresetId);
	const [previewOptions, setPreviewOptions] = useState<CardOptions | null>(null);
	const [showPreview, setShowPreview] = useState(false);

	// Cargar la lista de presets disponibles
	const loadPresets = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await getVisualPresetsByEntityType(entityType);

			if (response.success && response.data) {
				setPresets(response.data as VisualPreset[]);
			} else {
				setError(response.message);
				toast({
					title: 'Error',
					description: 'No se pudieron cargar los presets visuales',
					variant: 'destructive',
				});
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error desconocido';
			setError(message);
			toast({
				title: 'Error',
				description: 'Ocurrió un error al cargar los presets visuales',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	}, [entityType, toast]);

	// Cargar los presets al montar el componente
	useEffect(() => {
		loadPresets();
	}, [loadPresets]);

	// Cargar configuración del preset seleccionado para vista previa
	const loadPresetPreview = useCallback(
		async (presetId: string) => {
			try {
				setIsLoading(true);

				const response = await getCardOptionsFromPreset(presetId, entityType);

				if (response.success && response.data) {
					setPreviewOptions(response.data as CardOptions);
					setShowPreview(true);
				} else {
					toast({
						title: 'Aviso',
						description: 'No se pudo cargar la vista previa del preset',
					});
				}
			} catch (error) {
				console.error('Error al cargar vista previa del preset:', error);
			} finally {
				setIsLoading(false);
			}
		},
		[entityType, toast]
	);

	// Función para aplicar el preset a la entidad
	const handleApplyPreset = useCallback(
		async (presetId: string | null) => {
			try {
				setIsLoading(true);

				const response = await applyPresetToEntity(entityType, entityId, presetId);

				if (response.success) {
					setSelectedPresetId(presetId);

					// Si hay un cambio de preset, cargar opciones para la vista previa
					if (presetId) {
						const optionsResponse = await getCardOptionsFromPreset(presetId, entityType);
						if (optionsResponse.success && optionsResponse.data) {
							const options = optionsResponse.data as CardOptions;
							setPreviewOptions(options);
							// Notificar al componente padre del cambio
							if (onPresetChange) {
								onPresetChange(presetId, options);
							}
						}
					} else {
						// Si se ha quitado el preset, usar opciones por defecto
						setPreviewOptions(defaultOptions);
						// Notificar al componente padre del cambio
						if (onPresetChange) {
							onPresetChange(null, defaultOptions);
						}
					}

					toast({
						title: 'Éxito',
						description: presetId ? 'Preset visual aplicado correctamente' : 'Preset visual removido correctamente',
					});
				} else {
					toast({
						title: 'Error',
						description: response.message,
						variant: 'destructive',
					});
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Error desconocido';
				toast({
					title: 'Error',
					description: `Error al aplicar preset: ${message}`,
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
				setOpen(false);
			}
		},
		[entityType, entityId, defaultOptions, onPresetChange, toast]
	);

	// Al seleccionar un preset desde el dropdown
	const onPresetSelect = useCallback(
		(presetId: string) => {
			// Si es el mismo preset, no hacer nada
			if (presetId === selectedPresetId) {
				setOpen(false);
				return;
			}

			// Cargar vista previa y aplicar
			loadPresetPreview(presetId);
			handleApplyPreset(presetId);
		},
		[selectedPresetId, loadPresetPreview, handleApplyPreset]
	);

	// Quitar el preset
	const handleRemovePreset = useCallback(() => {
		handleApplyPreset(null);
		setShowPreview(false);
	}, [handleApplyPreset]);

	return (
		<div className={cn('flex flex-col space-y-2', className)}>
			<div className="flex items-center justify-between">
				<label htmlFor="preset-selector" className="text-sm font-medium">
					Preset Visual
				</label>
				{selectedPresetId && (
					<Button variant="ghost" size="sm" onClick={handleRemovePreset} disabled={isLoading}>
						Quitar preset
					</Button>
				)}
			</div>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id="preset-selector"
						variant="outline"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={isLoading}
					>
						{selectedPresetId
							? presets.find((preset) => preset.id === selectedPresetId)?.name || 'Preset personalizado'
							: 'Seleccionar preset'}
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[300px] p-0">
					<Command>
						<CommandInput placeholder="Buscar preset..." />
						<CommandList>
							<CommandEmpty>No se encontraron presets.</CommandEmpty>
							<CommandGroup>
								{isLoading ? (
									// Skeleton mientras carga
									<div className="space-y-2 p-2">
										{Array.from({ length: 3 }).map((_, i) => (
											<Skeleton key={`skeleton-${i}-${Date.now()}`} className="h-8 w-full" />
										))}
									</div>
								) : error ? (
									<div className="p-2 text-sm text-destructive">{error}</div>
								) : (
									presets.map((preset) => (
										<CommandItem key={preset.id} value={preset.id} onSelect={() => onPresetSelect(preset.id)}>
											<div className="flex items-center">
												{preset.isDefault ? (
													<Star className="mr-2 h-4 w-4 text-amber-500" />
												) : (
													<Paintbrush className="mr-2 h-4 w-4 text-muted-foreground" />
												)}
												<span>{preset.name}</span>
											</div>
											{selectedPresetId === preset.id && <Check className="ml-auto h-4 w-4" />}
										</CommandItem>
									))
								)}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* Vista previa del preset */}
			{showPreview && previewOptions && (
				<div className="mt-4 border rounded-md p-4">
					<p className="text-sm font-medium mb-2">Vista previa</p>
					<EntityCardPreview entityType={entityType} options={previewOptions} showControls={false} />
				</div>
			)}
		</div>
	);
}
