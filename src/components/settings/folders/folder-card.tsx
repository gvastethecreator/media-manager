import { Folder, Heart } from 'lucide-react';
import type { ReactNode } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { computeIsReindexing } from '@/components/settings/folders/utils/is-reindexing';
import { Badge } from '@/components/ui/badge';
import { useFolderStats } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import type { FolderStatsResponse } from '@/types/folders';
import { NormalModeControls } from './folder-card-action-controls';
import { EditModeControls } from './folder-card-edit-controls';
import { FolderErrorDisplay } from './folder-card-error-display';
import { ExpandedSubfolders } from './folder-card-expanded-subfolders';
import { FolderIndexStatusBadge, type IndexStatus } from './folder-card-index-status-badge';
import { FolderStatsDisplay } from './folder-card-stats-display';
import { ThumbnailGrid } from './folder-card-thumbnail-grid';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';
import { useIsCompleteStatus } from './hooks/use-complete-status';
import { useProgressTracking } from './hooks/use-progress-tracking';
import { getStatusMessage } from './utils/status-message';

// =====================================
// ✨ MODERN FOLDER CARD COMPONENT
// =====================================
// Completely redesigned with modern UI patterns, better performance,
// and cleaner architecture

/**
 * 📋 Component Responsibilities:
 * - Display folder information with modern design
 * - Handle folder actions (edit, reindex, select)
 * - Show processing status with smooth animations
 * - Provide responsive  for different screen sizes
 * - Maintain excellent performance with memoization
 */

// ===== FOLDER ICON COMPONENT =====
interface FolderIconProps {
	folder: ExtendedFolder;
	size?: 'sm' | 'md' | 'lg';
}

const FolderIcon = memo(({ folder, size = 'md' }: FolderIconProps) => {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-8 w-8',
	};

	const containerClasses = {
		sm: 'h-6 w-6',
		md: 'h-10 w-10',
		lg: 'h-12 w-12',
	};

	return (
		<div
			className={cn(
				'flex items-center justify-center bg-primary/5 ring-1 ring-primary/10 transition-all duration-200',
				'hover:scale-105 hover:bg-primary/10 hover:ring-primary/20',
				containerClasses[size]
			)}
		>
			{folder.emoji ? (
				<span
					className={cn('leading-none transition-transform duration-200 hover:scale-110', {
						'text-sm': size === 'sm',
						'text-base': size === 'md',
						'text-lg': size === 'lg',
					})}
				>
					{folder.emoji}
				</span>
			) : (
				<Folder
					className={cn('text-primary/70 transition-colors duration-200 hover:text-primary', sizeClasses[size])}
				/>
			)}
		</div>
	);
});

FolderIcon.displayName = 'FolderIcon';

// ===== FOLDER METADATA COMPONENT =====
interface FolderMetadataProps {
	folder: ExtendedFolder;
	parentFolderName?: string;
	indexStatus: IndexStatus;
	statusMessage?: ReactNode;
}

const FolderMetadata = memo(({ folder, parentFolderName, indexStatus, statusMessage }: FolderMetadataProps) => (
	<div className="flex min-w-0 flex-1 flex-col justify-center space-y-1.5">
		{/* Folder Name and Breadcrumb */}
		<div className="flex flex-col gap-0.5">
			<span className="truncate font-semibold text-foreground text-sm leading-tight">
				{/* Breadcrumb con mejor estilo */}
				{parentFolderName && (
					<span className="truncate font-normal text-primary/60 text-xs">
						{parentFolderName} <span className="text-primary/40">/</span>{' '}
					</span>
				)}
				{folder.name}
			</span>
		</div>

		{/* Status and badges row - separado para evitar solapamiento con controles */}
		<div className="flex flex-wrap items-center gap-2">
			<FolderIndexStatusBadge lastIndexed={folder.lastIndexed} status={indexStatus} />

			{/* Favorite indicator con animación */}
			{folder.isFavorite && (
				<Badge className="fade-in-50 h-5 animate-in px-1.5 text-xs duration-300" variant="secondary">
					<Heart className="mr-1 h-3 w-3 animate-pulse fill-current text-destructive" />
					Favorito
				</Badge>
			)}

			{/* Status message con transición */}
			{statusMessage && <div className="slide-in-from-right-2 animate-in duration-200">{statusMessage}</div>}
		</div>
	</div>
));

FolderMetadata.displayName = 'FolderMetadata';

// ===== FOLDER THUMBNAIL PREVIEW =====
interface FolderThumbnailProps {
	folderStats?: FolderStatsResponse;
	isCompact?: boolean;
	isLoading?: boolean;
}

const FolderThumbnail = memo(({ folderStats, isCompact = false, isLoading = false }: FolderThumbnailProps) => {
	const size = isCompact ? 'h-10 w-10' : 'h-12 w-12';

	// Mostrar loading state con animación
	if (isLoading) {
		return (
			<div
				className={cn(
					'flex shrink-0 items-center justify-center bg-muted/50 transition-all duration-300',
					'animate-pulse hover:bg-muted/70',
					size
				)}
			>
				<Folder className="h-4 w-4 text-muted-foreground/40" />
			</div>
		);
	}

	// Mostrar thumbnails si hay imágenes con hover effects
	if (folderStats?.recentImages && folderStats.recentImages.length > 0) {
		return (
			<div
				className={cn(
					'group/thumbnail relative shrink-0 overflow-hidden transition-all duration-300',
					'hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-primary/20',
					size
				)}
			>
				<ThumbnailGrid
					images={folderStats.recentImages.slice(0, 12)}
					showCount={false}
					totalImages={folderStats.totalImages || 0}
				/>
				{/* Overlay sutil en hover */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover/thumbnail:opacity-100" />
			</div>
		);
	}

	// Estado vacío con mejor indicador visual y hover
	return (
		<div
			className={cn(
				'flex shrink-0 items-center justify-center border-2 border-dashed transition-all duration-300',
				'border-muted-foreground/20 bg-muted/30 hover:scale-105 hover:border-muted-foreground/40 hover:bg-muted/50',
				size
			)}
		>
			<Folder className="h-4 w-4 text-muted-foreground/40 transition-colors duration-200 group-hover:text-muted-foreground/60" />
		</div>
	);
});

FolderThumbnail.displayName = 'FolderThumbnail';

// ===== FOLDER STATS SUMMARY =====
interface FolderStatsSummaryProps {
	folder: ExtendedFolder;
	folderStats?: FolderStatsResponse;
	isCompact?: boolean;
}

const FolderStatsSummary = memo(function FolderStatsSummary({
	folder,
	folderStats,
	isCompact = false,
}: FolderStatsSummaryProps) {
	return <FolderStatsDisplay folder={folder} folderStats={folderStats} />;
});

FolderStatsSummary.displayName = 'FolderStatsSummary';

// ===== MAIN FOLDER CARD COMPONENT =====

interface FolderCardProps {
	folder: ExtendedFolder;
	selectedFolder: string | null;
	isProcessing: boolean;
	processStatus: ExtendedProcessStatus;
	isGloballyProcessing: boolean;
	globalCurrentFolderId?: string | null;
	allFolders?: ExtendedFolder[];
	onReindex: (folderId: string) => void;
	onFolderClick: (folderId: string) => void;
	getFolderIndexStatus: (folder: ExtendedFolder) => IndexStatus;
	onUpdateFolder?: (folderId: string, updates: { emoji?: string; description?: string; isFavorite?: boolean }) => void;
	onToggleExpanded?: (folderId: string) => void;
	isExpanded?: boolean;
}

export const FolderCard = memo(
	({
		folder,
		selectedFolder,
		isProcessing,
		processStatus,
		isGloballyProcessing,
		globalCurrentFolderId,
		allFolders = [],
		onReindex,
		onFolderClick,
		getFolderIndexStatus,
		onUpdateFolder,
		onToggleExpanded,
		isExpanded = false,
	}: FolderCardProps) => {
		// ===== STATE MANAGEMENT =====
		const [isEditing, setIsEditing] = useState(false);
		const [editValues, setEditValues] = useState({
			emoji: folder.emoji || '',
			description: folder.description || '',
			isFavorite: folder.isFavorite,
		});

		// ===== DATA FETCHING =====
		const childStatsQuery = useFolderStats(folder.id || '', {
			staleTime: 30_000, // Cache por 30 segundos
			gcTime: 5 * 60 * 1000, // Mantener en cache 5 minutos
			enabled: Boolean(folder.id), // Solo consultar si hay ID
		});
		const folderStats = childStatsQuery.data as FolderStatsResponse | undefined; // ===== COMPUTED VALUES =====
		const subfolders = useMemo(() => allFolders.filter((f) => f.parentId === folder.id), [allFolders, folder.id]);

		const parentFolderName = useMemo(() => {
			if (!folder.parentId || allFolders.length === 0) return null;
			const parent = allFolders.find((f) => f.id === folder.parentId);
			return parent?.name || null;
		}, [folder.parentId, allFolders]);

		const isReindexing = useMemo(() => {
			if (!folder.id) return false;
			return computeIsReindexing({
				folderId: folder.id,
				processStatus,
				isGloballyProcessing,
				globalCurrentFolderId,
				isProcessingFlag: isProcessing,
			});
		}, [folder.id, processStatus, isGloballyProcessing, globalCurrentFolderId, isProcessing]);

		const isComplete = useIsCompleteStatus(processStatus, folder.id, isProcessing);
		const indexStatus = useMemo(() => getFolderIndexStatus(folder), [folder, getFolderIndexStatus]);

		// ===== PROGRESS TRACKING =====
		const [lastProgress, setLastProgress] = useState<number>(0);
		const [showCompleteAnimation, setShowCompleteAnimation] = useState<boolean>(false);

		useProgressTracking(isReindexing, isComplete, processStatus, folder.id, setLastProgress, setShowCompleteAnimation);

		// ===== EVENT HANDLERS =====
		const handleSaveEdit = useCallback(() => {
			if (onUpdateFolder && folder.id) {
				onUpdateFolder(folder.id, editValues);
			}
			setIsEditing(false);
		}, [onUpdateFolder, folder.id, editValues]);

		const handleCancelEdit = useCallback(() => {
			setEditValues({
				emoji: folder.emoji || '',
				description: folder.description || '',
				isFavorite: folder.isFavorite,
			});
			setIsEditing(false);
		}, [folder.emoji, folder.description, folder.isFavorite]);

		const handleEditValuesChange = useCallback((updates: Partial<typeof editValues>) => {
			setEditValues((prev) => ({ ...prev, ...updates }));
		}, []);

		const handleCardClick = useCallback(() => {
			if (!isEditing && folder.id) {
				onFolderClick(folder.id);
			}
		}, [isEditing, folder.id, onFolderClick]);

		const handleReindex = useCallback(() => {
			if (folder.id) {
				onReindex(folder.id);
			}
		}, [folder.id, onReindex]);

		// ===== MEMOIZED HANDLERS FOR CONTROLS =====
		const handleEdit = useCallback(() => {
			setIsEditing(true);
		}, []);

		const handleToggleExpanded = useCallback(() => {
			if (onToggleExpanded && folder.id) {
				onToggleExpanded(folder.id);
			}
		}, [onToggleExpanded, folder.id]);

		// ===== OPTIMIZED MEMOIZED HANDLERS TO PREVENT PROP CHANGES =====
		const stableOnFolderClick = useCallback(
			(folderId: string) => {
				onFolderClick(folderId);
			},
			[onFolderClick]
		);

		const stableOnReindex = useCallback(
			(folderId: string) => {
				onReindex(folderId);
			},
			[onReindex]
		);

		// ===== STATUS INDICATORS =====
		const statusMessage = getStatusMessage(isReindexing, showCompleteAnimation, isProcessing);
		const isSelected = selectedFolder === folder.id;
		const hasError = Boolean(folder.error);

		// OPTIMIZACIÓN: Detectar si está en modo focused (reindexado global)
		const isFocusedMode = isGloballyProcessing && globalCurrentFolderId === folder.id;

		// ===== RENDER =====
		return (
			<div>
				<div
					className={cn(
						'group overflow-hiddenborder-2 relative h-full transition-all duration-300 ease-out',
						// Padding adaptativo según el modo
						isFocusedMode ? 'p-6' : 'p-3',
						'border-border/60 bg-gradient-to-br from-card to-card/95 shadow-sm',
						// Hover effects con animaciones suaves
						'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10',
						// Estados visuales con mejor destacado en modo focused y transiciones
						{
							'translate-y-0 border-primary/30 shadow-lg shadow-primary/10 ring-2 ring-primary/20': isSelected,
							'border-ui-success-border shadow-lg shadow-ui-success ring-2 ring-ui-success-border':
								showCompleteAnimation,
							'scale-[1.02] border-ui-info-border shadow-ui-info shadow-xl ring-4 ring-ui-info-border':
								isReindexing && isFocusedMode,
							'border-ui-info-border shadow-md shadow-ui-info ring-2 ring-ui-info-border':
								isReindexing && !isFocusedMode,
							'border-destructive/30 shadow-destructive/10 shadow-lg ring-2 ring-destructive/20': hasError,
						}
					)}
				>
					{/* Progreso oculto en tarjetas (usamos ReindexTerminal) */}

					{/* Main content layout - mejor estructura sin overlaps */}
					<div className="flex min-w-0 flex-col gap-3">
						{/* Top section: Thumbnail + Icon + Metadata con mejor spacing */}
						<div className="flex min-w-0 items-start gap-3">
							<div className="flex shrink-0 items-center gap-2">
								<FolderThumbnail
									folderStats={folderStats}
									isCompact={!isFocusedMode}
									isLoading={childStatsQuery.isLoading}
								/>
								<FolderIcon folder={folder} size={isFocusedMode ? 'lg' : 'md'} />
							</div>
							<div className="min-w-0 flex-1 pr-20">
								<FolderMetadata
									folder={folder}
									indexStatus={indexStatus}
									parentFolderName={parentFolderName || undefined}
									statusMessage={statusMessage}
								/>
							</div>
						</div>

						{/* Stats Section - Always Visible with better spacing */}
						<FolderStatsSummary folder={folder} folderStats={folderStats} isCompact />
					</div>

					{/* Controls Section - Mejor posicionamiento para evitar solapamientos */}
					<div className="absolute top-3 right-3 z-20">
						<div
							aria-label="Controles de carpeta"
							className={cn(
								'flex items-center gap-1 rounded-lg border border-border/30 bg-background/95 shadow-lg backdrop-blur-sm',
								'opacity-0 transition-all duration-200 ease-out group-hover:opacity-100',
								'translate-x-2 hover:bg-background hover:shadow-xl group-hover:translate-x-0',
								// Padding adaptativo para controles
								isFocusedMode ? 'p-1.5' : 'p-1'
							)}
							role="toolbar"
						>
							{isEditing ? (
								<EditModeControls
									isDisabled={isGloballyProcessing}
									onCancel={handleCancelEdit}
									onSave={handleSaveEdit}
								/>
							) : (
								<NormalModeControls
									folder={folder}
									hasChildren={Boolean(folder.children?.length)}
									isExpanded={isExpanded}
									isGloballyProcessing={isGloballyProcessing}
									isReindexing={isReindexing}
									onEdit={handleEdit}
									onFolderClick={stableOnFolderClick}
									onReindex={stableOnReindex}
									onToggleExpanded={handleToggleExpanded}
									processStatus={processStatus}
									selectedFolder={selectedFolder}
								/>
							)}
						</div>
					</div>

					{/* Error Display con mejor positioning */}
					{hasError && (
						<div className="slide-in-from-top-2 mt-2 animate-in duration-300">
							<FolderErrorDisplay folder={folder} />
						</div>
					)}

					{/* Detalles de procesamiento ocultos en tarjetas (centralizado en terminal) */}
				</div>

				{/* Expanded Subfolders con animación */}
				{folder.children && folder.children.length > 0 && (
					<div className="slide-in-from-top-3 mt-2 animate-in duration-500 ease-out">
						<ExpandedSubfolders folders={folder.children} />
					</div>
				)}
			</div>
		);
	}
);

FolderCard.displayName = 'FolderCard';
