import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/store/ui/selection.slice';
import type { MediaItem } from './media-thumbnail';

export interface StatusBarProps {
	items: MediaItem[];
	className?: string;
	onRefresh?: () => void;
	isLoading?: boolean;
}

// Función utilitaria para formatear tamaños de archivo
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';

	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	const k = 1024;
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${(bytes / k ** i).toFixed(1)} ${units[i]}`;
}

// Función utilitaria para obtener el tamaño de un item
function getItemSize(item: MediaItem): number {
	// Intentar obtener el tamaño de diferentes propiedades posibles
	const size = (item as any).size || (item as any).fileSize || (item as any).sizeBytes || 0;
	return typeof size === 'number' ? size : 0;
}

export function StatusBar({ items, className, onRefresh, isLoading = false }: StatusBarProps) {
	const selectedIds = useSelectionStore((s) => s.selectedIds);

	// Calcular estadísticas de todos los items
	const totalFiles = items.length;
	const totalSize = items.reduce((acc, item) => acc + getItemSize(item), 0);

	// Calcular estadísticas de items seleccionados
	const selectedItems = items.filter((item) => selectedIds.includes(item.id));
	const selectedCount = selectedItems.length;
	const selectedSize = selectedItems.reduce((acc, item) => acc + getItemSize(item), 0);

	// Determinar el texto a mostrar
	const getStatusText = () => {
		if (selectedCount > 0) {
			return (
				<>
					<span className="font-medium">
						{selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
					</span>
					{selectedSize > 0 && <span className="text-muted-foreground"> ({formatFileSize(selectedSize)})</span>}
					<span className="text-muted-foreground"> de </span>
					<span>
						{totalFiles} archivo{totalFiles !== 1 ? 's' : ''}
					</span>
					{totalSize > 0 && <span className="text-muted-foreground"> ({formatFileSize(totalSize)})</span>}
				</>
			);
		}

		return (
			<>
				<span>
					{totalFiles} archivo{totalFiles !== 1 ? 's' : ''}
				</span>
				{totalSize > 0 && <span className="text-muted-foreground"> ({formatFileSize(totalSize)})</span>}
			</>
		);
	};

	return (
		<div
			aria-live="polite"
			className={cn(
				'flex items-center justify-between bg-background/95 px-4 py-2 text-xs',
				'backdrop-blur supports-[backdrop-filter]:bg-background/60',
				className
			)}
		>
			<div className="flex items-center gap-2">{getStatusText()}</div>

			{/* Información adicional del lado derecho */}
			<div className="flex items-center gap-4 text-muted-foreground text-xs">
				{/* Botón de refresh */}

				<Button disabled={isLoading} onClick={onRefresh} size="sm" variant="ghost">
					<RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
				</Button>
			</div>
		</div>
	);
}
