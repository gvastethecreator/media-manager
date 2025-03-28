'use client';

import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { EntityPresetSelector } from '@/components/features/entity-cards/ui/entity-preset-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PaintBrush } from 'lucide-react';
import { useCallback, useState } from 'react';

interface EntityDetailsPresetSectionProps {
	entityId: string;
	entityType: string;
	displayName: string; // Nombre para mostrar (ej: "Álbum")
	currentPresetId: string | null;
	defaultOptions: CardOptions;
	className?: string;
	onPresetApplied?: (presetId: string | null, options: CardOptions) => void;
}

/**
 * Sección de detalles para la configuración visual de una entidad
 * que permite seleccionar y aplicar presets visuales
 */
export function EntityDetailsPresetSection({
	entityId,
	entityType,
	displayName,
	currentPresetId,
	defaultOptions,
	className,
	onPresetApplied,
}: EntityDetailsPresetSectionProps) {
	const [selectedPresetId, setSelectedPresetId] = useState<string | null>(currentPresetId);
	const [currentOptions, setCurrentOptions] = useState<CardOptions>(defaultOptions);

	// Manejar cambio de preset
	const handlePresetChange = useCallback(
		(presetId: string | null, options: CardOptions) => {
			setSelectedPresetId(presetId);
			setCurrentOptions(options);

			// Notificar al componente padre
			if (onPresetApplied) {
				onPresetApplied(presetId, options);
			}
		},
		[onPresetApplied]
	);

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<div className="flex items-center space-x-2">
					<PaintBrush className="h-5 w-5 text-primary" />
					<CardTitle className="text-lg">Configuración Visual</CardTitle>
				</div>
				<CardDescription>
					Personaliza la apariencia visual de este {displayName.toLowerCase()} con presets guardados
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="space-y-6">
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Preset Visual Actual</h3>

						<p className="text-sm text-muted-foreground">
							{selectedPresetId
								? 'Este elemento tiene un preset visual personalizado aplicado.'
								: 'Este elemento usa la configuración visual por defecto.'}
						</p>
					</div>

					<Separator />

					<EntityPresetSelector
						entityId={entityId}
						entityType={entityType}
						currentPresetId={selectedPresetId}
						defaultOptions={defaultOptions}
						onPresetChange={handlePresetChange}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
