import { Folder, Heart } from 'lucide-react';
import { AnimatePresence, motion } from '@/components/ui/motion-shim';
import type { ReactNode } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { computeIsReindexing } from '@/components/settings/folders/utils/is-reindexing';
import { Badge } from '@/components/ui/badge';
import { useFolderStats } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import type { FolderStatsResponse } from '@/types/folders';
import { ExpandedSubfolders } from './expanded-subfolders';
import { NormalModeControls } from './folder-card-action-controls';
import { EditModeControls } from './folder-card-edit-controls';
import { FolderStatsDisplay } from './folder-card-stats-display';
import { FolderErrorDisplay } from './folder-error-display';
import { FolderIndexStatusBadge, type IndexStatus } from './folder-index-status-badge';
import { FolderProcessingDetails } from './folder-processing-details';
import { FolderProgressIndicator } from './folder-progress-indicator';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';
import { useIsCompleteStatus } from './hooks/use-complete-status';
import { useProgressTracking } from './hooks/use-progress-tracking';
import { ThumbnailGrid } from './thumbnail-grid';
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
		<div className={cn('flex items-center justify-center ring-1 ring-primary/10', containerClasses[size])}>
			{folder.emoji ? (
				<span className="text-sm leading-none">{folder.emoji}</span>
			) : (
				<Folder className={cn('text-primary/70', sizeClasses[size])} />
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
	<div className="flex min-w-0 flex-1 flex-col space-y-1">
		{/* Folder Name */}
		<span className="font-semibold text-foreground text-sm align-bottom truncate">
			{/* Breadcrumb */}
			{parentFolderName && <span className="truncate text-xs text-primary/50">{parentFolderName} / </span>}

			{folder.name}
		</span>

		{/* Status Row */}
		<div className="flex items-center gap-2 absolute top-2 right-2">
			<FolderIndexStatusBadge lastIndexed={folder.lastIndexed} status={indexStatus} />

			{/* Favorite indicator */}
			{folder.isFavorite && (
				<Badge className="h-5 px-1.5 text-xs" variant="secondary">
					<Heart className="mr-1 h-3 w-3 fill-current" />
					Favorito
				</Badge>
			)}

			{statusMessage}
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

	// Mostrar loading state
	if (isLoading) {
		return (
			<div className={cn('flex flex-shrink-0 animate-pulse items-center justify-center bg-muted/50', size)}>
				<Folder className="h-4 w-4 text-muted-foreground/40" />
			</div>
		);
	}

	// Mostrar thumbnails si hay imágenes
	if (folderStats?.recentImages && folderStats.recentImages.length > 0) {
		return (
			<div className={cn('relative flex-shrink-0 overflow-hidden', size)}>
				<ThumbnailGrid
					images={folderStats.recentImages.slice(0, 12)}
					showCount={false}
					totalImages={folderStats.totalImages || 0}
				/>
			</div>
		);
	}

	// Estado vacío con mejor indicador visual
	return (
		<div
			className={cn(
				'flex flex-shrink-0 items-center justify-center border-2 border-muted-foreground/20 border-dashed bg-muted/30',
				size
			)}
		>
			<Folder className="h-4 w-4 text-muted-foreground/40" />
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
	isCompact = false
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
		const childStatsQuery = useFolderStats(folder.id || '');
		const folderStats = childStatsQuery.data as FolderStatsResponse | undefined;

		// ===== COMPUTED VALUES =====
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

		// ===== STATUS INDICATORS =====
		const statusMessage = getStatusMessage(isReindexing, showCompleteAnimation, isProcessing);
		const isSelected = selectedFolder === folder.id;
		const hasError = Boolean(folder.error);

		// ===== RENDER =====
		return (
			<div>
				<div
					className={cn(
						'group relative h-full overflow-hidden border-2 p-2 transition-all duration-200',
						'border-border/60 bg-gradient-to-br from-card to-card/95',
						'hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5',
						{
							'border-primary/20 ring-2 ring-primary/30': isSelected,
							'border-emerald-400/20 ring-2 ring-emerald-400/30': showCompleteAnimation,
							'border-blue-400/20 ring-2 ring-blue-400/30': isReindexing,
							'border-destructive/20 ring-2 ring-destructive/30': hasError,
						}
					)}
				>
					{/* Processing Progress Indicator */}
					<FolderProgressIndicator
						isReindexing={isReindexing}
						lastProgress={lastProgress}
						showCompleteAnimation={showCompleteAnimation}
					/>

					{/* Main clickeable content area */}

					{/* Left Section: Icon + Metadata */}
					<div className="flex min-w-0 flex-1 items-start gap-3">
						<FolderThumbnail folderStats={folderStats} isCompact isLoading={childStatsQuery.isLoading} />
						<FolderIcon folder={folder} size="md" />
						<FolderMetadata
							folder={folder}
							indexStatus={indexStatus}
							parentFolderName={parentFolderName || undefined}
							statusMessage={statusMessage}
						/>
					</div>

					{/* Controls Section - Positioned absolutely to avoid click conflicts */}
					<div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-60 sm:group-hover:opacity-100">
						<div
							className="flex items-center gap-1 rounded-md border border-border/20 bg-background/90 p-1 shadow-sm backdrop-blur-sm"
							role="toolbar"
							aria-label="Controles de carpeta"
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
									onFolderClick={onFolderClick}
									onReindex={handleReindex}
									onToggleExpanded={handleToggleExpanded}
									processStatus={processStatus}
									selectedFolder={selectedFolder}
								/>
							)}
						</div>
					</div>

					{/* Error Display */}
					{hasError && <FolderErrorDisplay folder={folder} />}

					{/* Processing Details */}
					{(isReindexing || (processStatus?.folderId === folder.id && (processStatus?.progress ?? 0) > 0)) && (
						<FolderProcessingDetails
							isReindexing={isReindexing}
							lastProgress={lastProgress}
							processStatus={processStatus}
							subfolders={subfolders}
						/>
					)}

					{/* Stats Section - Always Visible */}
					<FolderStatsSummary folder={folder} folderStats={folderStats} isCompact />
				</div>

				{/* Expanded Subfolders */}
				{folder.children && folder.children.length > 0 && (
					<div>
						<ExpandedSubfolders folders={folder.children} />
					</div>
				)}
			</div>
		);
	}
);

FolderCard.displayName = 'FolderCard';
