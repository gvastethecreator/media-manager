/**
 * @file Selector de presets para formularios de entidades
 * @module components/settings/common/preset-selector
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/styles';
import type { FieldPreset } from '@/config/entity-field-presets';

interface PresetSelectorProps {
	/** Lista de presets disponibles */
	presets: FieldPreset[];
	/** Preset actualmente seleccionado */
	selectedPresetId: string;
	/** Callback al seleccionar un preset */
	onSelectPreset: (presetId: string) => void;
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Componente para seleccionar entre diferentes presets de campos
 */
export function PresetSelector({ presets, selectedPresetId, onSelectPreset, className }: PresetSelectorProps) {
	return (
		<div className={cn('space-y-2', className)}>
			<h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Nivel de Detalle</h4>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
				{presets.map((preset) => {
					const isSelected = preset.id === selectedPresetId;
					return (
						<button
							key={preset.id}
							type="button"
							onClick={() => onSelectPreset(preset.id)}
							className={cn(
								'relative flex flex-col items-start p-3 rounded-lg border-2 transition-all',
								'hover:border-primary/50 hover:bg-primary/5',
								'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
								isSelected
									? 'border-primary bg-primary/10 shadow-sm'
									: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
							)}
							aria-pressed={isSelected}
						>
							{isSelected && (
								<div className="absolute top-2 right-2">
									<Check className="w-4 h-4 text-primary" />
								</div>
							)}
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xl">{preset.icon}</span>
								<span
									className={cn(
										'text-sm font-semibold',
										isSelected ? 'text-primary' : 'text-gray-900 dark:text-gray-100'
									)}
								>
									{preset.name}
								</span>
							</div>
							<p
								className={cn(
									'text-xs text-left',
									isSelected ? 'text-primary/80' : 'text-gray-500 dark:text-gray-400'
								)}
							>
								{preset.description}
							</p>
						</button>
					);
				})}
			</div>
		</div>
	);
}
