import { Check, ChevronDown, Columns, Grid, LayoutGrid, List, Settings } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useViewConfiguration } from '../../../hooks/use-view-configuration';
import { ViewPreset, ViewType } from '../../../types/file-browser/view-configuration';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

interface ViewConfigurationSelectorProps {
	viewType: ViewType;
	onConfigurationPanelOpen?: () => void;
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

export const ViewConfigurationSelector: React.FC<ViewConfigurationSelectorProps> = ({
	viewType,
	onConfigurationPanelOpen,
	className = '',
}) => {
	const { currentConfiguration, availablePresets, applyPreset } = useViewConfiguration(viewType);

	const [isOpen, setIsOpen] = useState(false);
	const currentConfig = currentConfiguration;
	const presets = availablePresets;
	const currentPresetId = null; // TODO: Implement current preset tracking

	const handlePresetSelect = useCallback(
		async (preset: ViewPreset) => {
			const success = await applyPreset(preset.id);
			if (success) {
				toast.success(`Preset "${preset.name}" aplicado`);
			}
			setIsOpen(false);
		},
		[applyPreset]
	);

	const handleOpenConfigPanel = useCallback(() => {
		onConfigurationPanelOpen?.();
		setIsOpen(false);
	}, [onConfigurationPanelOpen]);

	const ViewIcon = VIEW_TYPE_ICONS[viewType];
	const currentPreset = presets.find((p) => p.id === currentPresetId);

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<DropdownMenuTrigger asChild>
				<Button className={`h-8 gap-2 ${className}`} size="sm" variant="outline">
					<ViewIcon className="h-4 w-4" />
					<span className="hidden sm:inline">{currentPreset?.name || 'Configuración'}</span>
					<ChevronDown className="h-3 w-3" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-64">
				<DropdownMenuLabel className="flex items-center gap-2">
					<ViewIcon className="h-4 w-4" />
					Vista {VIEW_TYPE_LABELS[viewType]}
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				{presets.length > 0 ? (
					<>
						{presets.map((preset) => {
							const isSelected = preset.id === currentPresetId;

							return (
								<DropdownMenuItem
									className="flex cursor-pointer items-center justify-between"
									key={preset.id}
									onClick={() => handlePresetSelect(preset)}
								>
									<div className="flex items-center gap-2">
										<div className="flex flex-1 items-center gap-2">
											<span className="font-medium">{preset.name}</span>
											{preset.category !== 'default' && (
												<Badge className="text-xs" variant={preset.category === 'custom' ? 'secondary' : 'outline'}>
													{preset.category}
												</Badge>
											)}
										</div>
										{isSelected && <Check className="h-4 w-4 text-primary" />}
									</div>
								</DropdownMenuItem>
							);
						})}

						<DropdownMenuSeparator />
					</>
				) : (
					<DropdownMenuItem disabled>
						<span className="text-muted-foreground">No hay presets disponibles</span>
					</DropdownMenuItem>
				)}

				<DropdownMenuItem className="flex cursor-pointer items-center gap-2" onClick={handleOpenConfigPanel}>
					<Settings className="h-4 w-4" />
					<span>Configuración avanzada...</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ViewConfigurationSelector;
