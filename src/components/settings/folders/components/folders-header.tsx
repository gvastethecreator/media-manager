import { Grid3x3, List, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { GlobalReindexProgress } from './global-reindex-progress';

type ViewMode = 'table' | 'grid';

interface FoldersHeaderProps {
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	showAdvancedConfig: boolean;
	onToggleAdvancedConfig: () => void;
	useStructuredFlow: boolean;
	onUseStructuredFlowChange: (value: boolean) => void;
	skipThumbnails: boolean;
	onSkipThumbnailsChange: (value: boolean) => void;
	skipMetadata: boolean;
	onSkipMetadataChange: (value: boolean) => void;
	isGloballyProcessing: boolean;
	globalProgress: number;
	onGlobalReindex: () => void;
}

/**
 * Header con controles principales y configuración de reindexación
 */
export function FoldersHeader({
	viewMode,
	onViewModeChange,
	showAdvancedConfig,
	onToggleAdvancedConfig,
	useStructuredFlow,
	onUseStructuredFlowChange,
	skipThumbnails,
	onSkipThumbnailsChange,
	skipMetadata,
	onSkipMetadataChange,
	isGloballyProcessing,
	globalProgress,
	onGlobalReindex,
}: FoldersHeaderProps) {
	return (
		<div className="space-y-3 border-border/30 border-b bg-background/50 p-3 backdrop-blur-sm">
			{/* Toolbar principal */}
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Gestión de Carpetas</h2>
				<div className="flex items-center gap-2">
					{/* Toggle de vista */}
					<div className="flex items-center gap-1 border border-border/40 p-1">
						<Button
							className={cn('h-7 w-7 p-0', viewMode === 'table' && 'bg-primary text-primary-foreground')}
							onClick={() => onViewModeChange('table')}
							size="sm"
							variant={viewMode === 'table' ? 'default' : 'ghost'}
						>
							<List className="h-4 w-4" />
						</Button>
						<Button
							className={cn('h-7 w-7 p-0', viewMode === 'grid' && 'bg-primary text-primary-foreground')}
							onClick={() => onViewModeChange('grid')}
							size="sm"
							variant={viewMode === 'grid' ? 'default' : 'ghost'}
						>
							<Grid3x3 className="h-4 w-4" />
						</Button>
					</div>
					{/* Botón de configuración avanzada */}
					<Button
						className={cn(showAdvancedConfig && 'bg-primary/10 text-primary')}
						onClick={onToggleAdvancedConfig}
						size="sm"
						variant="outline"
					>
						<SettingsIcon className="mr-2 h-4 w-4" />
						Configuración
					</Button>
					{/* Botón de reindexación global */}
					<Button disabled={isGloballyProcessing} onClick={onGlobalReindex} size="sm" variant="default">
						<RefreshCw className={cn('mr-2 h-4 w-4', isGloballyProcessing && 'animate-spin')} />
						Reindexar Todo
					</Button>
				</div>
			</div>

			{/* Barra de progreso global */}
			<GlobalReindexProgress progress={globalProgress} show={isGloballyProcessing} />

			{/* Configuración avanzada (colapsable) */}
			{showAdvancedConfig && (
				<div className="space-y-2 border border-border/40 bg-muted/20 p-3">
					<h3 className="mb-2 font-medium text-sm">Configuración Avanzada de Reindexación</h3>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div className="flex items-center justify-between space-x-2">
							<Label className="text-xs" htmlFor="use-structured-flow">
								Flujo Estructurado
							</Label>
							<Switch
								checked={useStructuredFlow}
								id="use-structured-flow"
								onCheckedChange={onUseStructuredFlowChange}
							/>
						</div>
						<div className="flex items-center justify-between space-x-2">
							<Label className="text-xs" htmlFor="skip-thumbnails">
								Omitir Miniaturas
							</Label>
							<Switch checked={skipThumbnails} id="skip-thumbnails" onCheckedChange={onSkipThumbnailsChange} />
						</div>
						<div className="flex items-center justify-between space-x-2">
							<Label className="text-xs" htmlFor="skip-metadata">
								Omitir Metadatos
							</Label>
							<Switch checked={skipMetadata} id="skip-metadata" onCheckedChange={onSkipMetadataChange} />
						</div>
					</div>
					<p className="text-muted-foreground text-xs">
						El flujo estructurado organiza las carpetas por jerarquía antes de reindexar. Omitir miniaturas y metadatos
						acelera el proceso pero reduce la información disponible.
					</p>
				</div>
			)}
		</div>
	);
}
