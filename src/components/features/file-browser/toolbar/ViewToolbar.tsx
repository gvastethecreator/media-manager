import React, { useState } from 'react';
import { Settings, Grid, List, LayoutGrid, Columns } from 'lucide-react';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { ViewConfigurationSelector } from '@/components/file-browser/view-configuration/ViewConfigurationSelector';
import { ViewConfigurationPanel } from '@/components/file-browser/view-configuration/ViewConfigurationPanel';
import { ProgressIndicator } from '../progress/progress-indicator';
import { ViewType } from '@/types/file-browser/view-configuration';
import { Button } from '../../../ui/button';
import { Separator } from '../../../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { UndoRedoToolbar } from '../undo-redo/UndoRedoToolbar';
import { cn } from '@/lib/utils';

interface ViewToolbarProps {
  className?: string;
}

const VIEW_MODE_ICONS = {
  list: List,
  grid: Grid,
  cards: LayoutGrid,
  masonry: Columns,
} as const;

const VIEW_MODE_LABELS = {
  list: 'Lista',
  grid: 'Cuadrícula',
  cards: 'Tarjetas',
  masonry: 'Mosaico',
} as const;

export const ViewToolbar: React.FC<ViewToolbarProps> = ({ className }) => {
  const { viewMode, setViewMode } = useViewOptionsStore();
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as any);
  };

  const handleConfigPanelOpen = () => {
    setShowConfigPanel(true);
  };

  const handleConfigPanelClose = () => {
    setShowConfigPanel(false);
  };

  // Mapear viewMode a ViewType
  const getViewType = (mode: string): ViewType => {
    switch (mode) {
      case 'list':
        return 'list';
      case 'grid':
      case 'simple-grid':
        return 'grid';
      case 'cards':
        return 'cards';
      case 'masonry':
        return 'masonry';
      default:
        return 'grid';
    }
  };

  const currentViewType = getViewType(viewMode);

  return (
    <>
      <div className={cn('flex items-center justify-between gap-2', className)}>
        <div className="flex items-center gap-2">
          {/* Undo/Redo Toolbar */}
          <UndoRedoToolbar
            className="flex items-center gap-1"
            buttonVariant="outline"
            buttonSize="sm"
            showHistoryButton={false}
            showSeparator={false}
          />

          <Separator orientation="vertical" className="h-6" />

          {/* Selector de modo de vista */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                {React.createElement(VIEW_MODE_ICONS[currentViewType] || Grid, {
                  className: 'h-4 w-4',
                })}
                <span className="hidden sm:inline">
                  {VIEW_MODE_LABELS[currentViewType] || 'Vista'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(VIEW_MODE_LABELS).map(([mode, label]) => {
                const Icon = VIEW_MODE_ICONS[mode as keyof typeof VIEW_MODE_ICONS];
                const isSelected = currentViewType === mode;

                return (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => handleViewModeChange(mode)}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      isSelected && 'bg-accent'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Selector de configuración de vista */}
          <ViewConfigurationSelector
            viewType={currentViewType}
            onConfigurationPanelOpen={handleConfigPanelOpen}
          />

          {/* Botón de configuración avanzada */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleConfigPanelOpen}
            className="h-8"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Configurar</span>
          </Button>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          showDetails={true}
          onClick={() => {
            // TODO: Abrir panel de progreso detallado si es necesario
            console.log('Progress indicator clicked');
          }}
        />
      </div>

      {/* Panel de configuración */}
      <Dialog open={showConfigPanel} onOpenChange={setShowConfigPanel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración de Vista</DialogTitle>
          </DialogHeader>
          <ViewConfigurationPanel
            viewType={currentViewType}
            onConfigurationChange={() => {
              // Opcional: manejar cambios de configuración
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewToolbar;