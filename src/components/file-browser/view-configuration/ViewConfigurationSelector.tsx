import React, { useState, useCallback } from 'react';
import { Settings, ChevronDown, Check, Grid, List, LayoutGrid, Columns } from 'lucide-react';
import { useViewConfiguration } from '../../../hooks/use-view-configuration';
import { ViewType, ViewPreset } from '../../../types/file-browser/view-configuration';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Badge } from '../../ui/badge';
import { toast } from 'sonner';

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
  const {
    currentConfiguration,
    availablePresets,
    applyPreset,
  } = useViewConfiguration(viewType);

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
  const currentPreset = presets.find(p => p.id === currentPresetId);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-2 ${className}`}
        >
          <ViewIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentPreset?.name || 'Configuración'}
          </span>
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
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium">{preset.name}</span>
                      {preset.category !== 'default' && (
                        <Badge
                          variant={preset.category === 'custom' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
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
        
        <DropdownMenuItem
          onClick={handleOpenConfigPanel}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Settings className="h-4 w-4" />
          <span>Configuración avanzada...</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ViewConfigurationSelector;