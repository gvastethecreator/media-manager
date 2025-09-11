/**
 * 🧭 FolderNavigationBar - Navegación mejorada para carpetas
 *
 * Proporciona navegación intuitiva con:
 * - Botón atrás prominente
 * - Breadcrumbs específicos para carpetas
 * - Indicador de carpeta actual
 * - Contador de elementos
 */

import { ArrowLeft, ChevronRight, Folder, Home } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useNavigation } from '@/components/navigation/hooks/navigation.utils';
import { Button } from '@/components/ui/button';
import { motion } from '@/components/ui/motion-shim';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFolder } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import { useHierarchicalNavigation } from '@/lib/utils/folder/hierarchical-navigation';

interface FolderNavigationBarProps {
	/** ID de la carpeta actual */
	folderId: string | null;
	/** Total de items mostrados */
	itemCount?: number;
	/** Desglose de items por tipo */
	itemBreakdown?: {
		folders: number;
		images: number;
		videos: number;
		audios: number;
		documents: number;
		others: number;
	};
	/** Callback para navegación hacia atrás */
	onNavigateBack?: () => void;
	/** Callback para navegación a carpeta específica */
	onNavigateToFolder?: (folderId: string) => void;
	/** Estilos adicionales */
	className?: string;
}

export const FolderNavigationBar = memo(function FolderNavigationBarImpl({
	folderId,
	itemCount = 0,
	itemBreakdown,
	onNavigateBack,
	onNavigateToFolder,
	className,
}: FolderNavigationBarProps) {
	// Obtener datos de la carpeta actual
	const { data: currentFolder, isLoading } = useFolder(folderId || '');
	const { navigateToFolder } = useNavigation();
	const { buildFullBreadcrumbs } = useHierarchicalNavigation();

	// Construir breadcrumbs jerárquicos completos
	const breadcrumbs = useMemo(() => {
		return buildFullBreadcrumbs(folderId);
	}, [folderId, buildFullBreadcrumbs]);

	// Manejar navegación hacia atrás
	const handleGoBack = () => {
		if (onNavigateBack) {
			onNavigateBack();
		} else if (currentFolder?.parentId) {
			navigateToFolder(currentFolder.parentId);
		} else {
			// Ir a vista raíz de carpetas
			navigateToFolder('/');
		}
	};

	// Manejar navegación a carpeta específica
	const handleNavigateToFolder = (targetFolderId: string) => {
		if (onNavigateToFolder) {
			onNavigateToFolder(targetFolderId);
		} else if (targetFolderId === '/') {
			// Navegar a vista raíz de carpetas
			navigateToFolder('/');
		} else {
			// Navegar a carpeta específica
			navigateToFolder(targetFolderId);
		}
	};

	// Generar descripción de elementos
	const itemDescription = useMemo(() => {
		if (!itemBreakdown) {
			return itemCount > 0 ? `${itemCount} elementos` : 'Sin elementos';
		}

		const parts = [];
		if (itemBreakdown.folders > 0) parts.push(`${itemBreakdown.folders} carpetas`);
		if (itemBreakdown.images > 0) parts.push(`${itemBreakdown.images} imágenes`);
		if (itemBreakdown.videos > 0) parts.push(`${itemBreakdown.videos} videos`);
		if (itemBreakdown.audios > 0) parts.push(`${itemBreakdown.audios} audios`);
		if (itemBreakdown.documents > 0) parts.push(`${itemBreakdown.documents} documentos`);
		if (itemBreakdown.others > 0) parts.push(`${itemBreakdown.others} otros`);

		return parts.length > 0 ? parts.join(', ') : 'Sin elementos';
	}, [itemCount, itemBreakdown]);

	if (isLoading) {
		return (
			<div className={cn('flex items-center gap-2 p-2', className)}>
				<div className="h-8 w-8 animate-pulse rounded bg-muted" />
				<div className="h-4 w-32 animate-pulse rounded bg-muted" />
			</div>
		);
	}

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'flex items-center justify-between gap-2 border-border border-b bg-background/80 p-3 backdrop-blur-sm',
				className
			)}
			initial={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.2 }}
		>
			{/* Navegación y Breadcrumbs */}
			<div className="flex min-w-0 flex-1 items-center gap-2">
				{/* Botón Atrás */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button className="h-8 w-8 shrink-0" onClick={handleGoBack} size="icon" variant="ghost">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Ir atrás</TooltipContent>
				</Tooltip>

				{/* Breadcrumbs jerárquicos */}
				<nav className="flex min-w-0 items-center gap-1">
					{breadcrumbs.map((crumb, index) => (
						<div className="flex items-center gap-1" key={crumb.id}>
							{index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}

							{crumb.isActive ? (
								// Carpeta actual - no clickeable
								<div className="flex items-center gap-1 rounded px-2 py-1 text-xs">
									{crumb.emoji && <span className="text-sm">{crumb.emoji}</span>}
									{crumb.id === 'root' ? (
										<Home className="h-3 w-3 text-primary" />
									) : (
										<Folder className="h-3 w-3 text-primary" />
									)}
									<span className="max-w-40 truncate font-medium text-primary">{crumb.name}</span>
								</div>
							) : (
								// Carpeta padre - clickeable
								<Button
									className="h-7 gap-1 px-2 text-xs"
									onClick={() => handleNavigateToFolder(crumb.id === 'root' ? '/' : crumb.id)}
									variant="ghost"
								>
									{crumb.emoji && <span className="text-sm">{crumb.emoji}</span>}
									{crumb.id === 'root' ? <Home className="h-3 w-3" /> : <Folder className="h-3 w-3" />}
									<span className="max-w-32 truncate">{crumb.name}</span>
								</Button>
							)}
						</div>
					))}
				</nav>
			</div>

			{/* Contador de elementos */}
			<div className="flex shrink-0 items-center gap-2 text-muted-foreground text-xs">
				<Tooltip>
					<TooltipTrigger>
						<span>{itemDescription}</span>
					</TooltipTrigger>
					<TooltipContent side="left">
						{itemBreakdown && (
							<div className="space-y-1">
								<div>Total: {itemCount} elementos</div>
								{itemBreakdown.folders > 0 && <div>📁 {itemBreakdown.folders} carpetas</div>}
								{itemBreakdown.images > 0 && <div>🖼️ {itemBreakdown.images} imágenes</div>}
								{itemBreakdown.videos > 0 && <div>🎬 {itemBreakdown.videos} videos</div>}
								{itemBreakdown.audios > 0 && <div>🎵 {itemBreakdown.audios} audios</div>}
								{itemBreakdown.documents > 0 && <div>📄 {itemBreakdown.documents} documentos</div>}
								{itemBreakdown.others > 0 && <div>📦 {itemBreakdown.others} otros</div>}
							</div>
						)}
					</TooltipContent>
				</Tooltip>
			</div>
		</motion.div>
	);
});

FolderNavigationBar.displayName = 'FolderNavigationBar';
