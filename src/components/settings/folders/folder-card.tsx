import { Folder } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { computeIsReindexing } from '@/components/settings/folders/utils/is-reindexing';
import { Card, CardContent } from '@/components/ui/card';
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

interface CardHeaderSectionProps {
	folder: ExtendedFolder;
	indexStatus: IndexStatus;
	parentFolderName: string | null;
	statusMessage: ReactNode | null;
	isEditing: boolean;
	onSaveEdit: () => void;
	onCancelEdit: () => void;
	enterEdit: () => void;
	isGloballyProcessing: boolean;
	isExpanded: boolean;
	isReindexing: boolean;
	onFolderClick: (folderId: string) => void;
	onReindex: (folderId: string) => void;
	onToggleExpanded?: (folderId: string) => void;
	processStatus: ExtendedProcessStatus;
	selectedFolder: string | null;
}

function CardHeaderSection({
	folder,
	indexStatus,
	parentFolderName,
	statusMessage,
	isEditing,
	onSaveEdit,
	onCancelEdit,
	enterEdit,
	isGloballyProcessing,
	isExpanded,
	isReindexing,
	onFolderClick,
	onReindex,
	onToggleExpanded,
	processStatus,
	selectedFolder,
}: CardHeaderSectionProps) {
	return (
		<header className="flex items-start justify-between" data-density="compact">
			<div className="min-w-0 flex-1">
				{/* Breadcrumb compacto */}
				{parentFolderName && (
					<div className="mb-0.5 flex items-center text-[10px] text-muted-foreground">
						<span className="truncate">{parentFolderName}</span>
						<span className="mx-1">/</span>
					</div>
				)}

				<div className="flex items-center gap-1.5">
					<div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-primary/10">
						{folder.emoji ? (
							<span className="text-[10px]">{folder.emoji}</span>
						) : (
							<Folder className="h-2.5 w-2.5 text-primary" />
						)}
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="truncate font-medium text-[12px] leading-tight">{folder.name}</h3>
					</div>
				</div>

				<div className="mt-1 flex items-center gap-1">
					<FolderIndexStatusBadge lastIndexed={folder.lastIndexed} status={indexStatus} />
					{statusMessage}
				</div>
			</div>
			<div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
				{isEditing ? (
					<EditModeControls isDisabled={isGloballyProcessing} onCancel={onCancelEdit} onSave={onSaveEdit} />
				) : (
					<NormalModeControls
						folder={folder}
						hasChildren={Boolean(folder.children && folder.children.length > 0)}
						isExpanded={isExpanded}
						isGloballyProcessing={isGloballyProcessing}
						isReindexing={isReindexing}
						onEdit={enterEdit}
						onFolderClick={onFolderClick}
						onReindex={onReindex}
						onToggleExpanded={onToggleExpanded}
						processStatus={processStatus}
						selectedFolder={selectedFolder}
					/>
				)}
			</div>
		</header>
	);
}

interface FolderCardProps {
	folder: ExtendedFolder;
	selectedFolder: string | null;
	isProcessing: boolean;
	processStatus: ExtendedProcessStatus;
	isGloballyProcessing: boolean;
	globalCurrentFolderId?: string | null;
	allFolders?: ExtendedFolder[]; // Para buscar información del padre
	onReindex: (folderId: string) => void;
	onFolderClick: (folderId: string) => void;
	getFolderIndexStatus: (folder: ExtendedFolder) => IndexStatus;
	onUpdateFolder?: (folderId: string, updates: { emoji?: string; description?: string; isFavorite?: boolean }) => void;
	onToggleExpanded?: (folderId: string) => void;
	isExpanded?: boolean;
}

export function FolderCard({
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
}: FolderCardProps) {
	// Estados para edición
	const [isEditing, setIsEditing] = useState(false);
	const [editValues, setEditValues] = useState({
		emoji: folder.emoji || '',
		description: folder.description || '',
		isFavorite: folder.isFavorite,
	});

	// Hook para obtener estadísticas detalladas
	const childStatsQuery = useFolderStats(folder.id || '');
	const folderStats = childStatsQuery.data as FolderStatsResponse | undefined;

	// Obtener subcarpetas usando allFolders
	const subfolders = useMemo(() => {
		return allFolders.filter((f) => f.parentId === folder.id);
	}, [allFolders, folder.id]);

	// Estado del procesamiento
	const isReindexing = useMemo(() => {
		if (!folder.id) {
			return false;
		}
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

	// Estado local para tracking
	const [lastProgress, setLastProgress] = useState<number>(0);
	const [showCompleteAnimation, setShowCompleteAnimation] = useState<boolean>(false);

	// Usar hook de tracking
	useProgressTracking(isReindexing, isComplete, processStatus, folder.id, setLastProgress, setShowCompleteAnimation);

	// Funciones para manejar la edición
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

	// Obtener mensaje de estado
	const statusMessage = getStatusMessage(isReindexing, showCompleteAnimation, isProcessing);

	// Función helper para encontrar el nombre de la carpeta padre
	const parentFolderName = useMemo(() => {
		if (!(folder.parentId && allFolders.length)) {
			return null;
		}
		const parentFolder = allFolders.find((f) => f.id === folder.parentId);
		return parentFolder?.name || null;
	}, [folder.parentId, allFolders]);

	return (
		<motion.div
			animate={{
				opacity: [0, 1],
				y: [20, 0],
			}}
			className={cn('group h-full rounded-lg', selectedFolder === folder.id && 'ring-2 ring-primary')}
		>
			<Card
				className={cn(
					'@container/card h-full max-h-48 overflow-hidden border transition-all hover:shadow-md',
					'[&[data-density="compact"]]:max-h-44',
					isReindexing && 'ring-2 ring-primary/20',
					showCompleteAnimation && 'ring-2 ring-emerald-400/20'
				)}
				data-density="compact"
			>
				{/* Indicador visual de procesamiento */}
				<FolderProgressIndicator
					isReindexing={isReindexing}
					lastProgress={lastProgress}
					showCompleteAnimation={showCompleteAnimation}
				/>

				<CardContent
					className="@container/content p-2.5 [&[data-density='compact']]:p-2 [&[data-density='compact']]:text-[13px]"
					data-density="compact"
				>
					<div className="space-y-1.5 [&[data-density='compact']]:space-y-1" data-density="compact">
						{/* Header con breadcrumb y controles */}
						<CardHeaderSection
							enterEdit={() => setIsEditing(true)}
							folder={folder}
							indexStatus={indexStatus}
							isEditing={isEditing}
							isExpanded={isExpanded}
							isGloballyProcessing={isGloballyProcessing}
							isReindexing={isReindexing}
							onCancelEdit={handleCancelEdit}
							onFolderClick={onFolderClick}
							onReindex={onReindex}
							onSaveEdit={handleSaveEdit}
							onToggleExpanded={onToggleExpanded}
							parentFolderName={parentFolderName}
							processStatus={processStatus}
							selectedFolder={selectedFolder}
							statusMessage={statusMessage}
						/>

						{/* Main content section */}
						<section className="flex items-center @[300px]:gap-3 gap-2" data-density="compact">
							{/* Thumbnail micro */}
							<div className="flex-shrink-0">
								{folderStats?.recentImages && folderStats.recentImages.length > 0 ? (
									<div className="relative @[280px]:h-10 h-8 @[280px]:w-10 w-8">
										<ThumbnailGrid
											images={folderStats.recentImages.slice(0, 4)}
											showCount={false}
											totalImages={folderStats.totalImages || 0}
										/>
									</div>
								) : (
									<div className="flex @[280px]:h-10 h-8 @[280px]:w-10 w-8 items-center justify-center rounded border border-muted-foreground/20 border-dashed bg-muted/30">
										<Folder className="h-3 w-3 text-muted-foreground/50" />
									</div>
								)}
							</div>

							{/* Metrics compactos */}
							<div className="min-w-0 flex-1">
								<FolderStatsDisplay folder={folder} folderStats={folderStats} />
							</div>
						</section>

						{/* Error display */}
						<FolderErrorDisplay folder={folder} />

						{/* Footer con detalles del proceso */}
						{(isReindexing || (processStatus?.folderId === folder.id && (processStatus?.progress ?? 0) > 0)) && (
							<footer className="border-border border-t pt-1.5" data-density="compact">
								<FolderProcessingDetails
									isReindexing={isReindexing}
									lastProgress={lastProgress}
									processStatus={processStatus}
									subfolders={subfolders}
								/>
							</footer>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Subcarpetas expandidas */}
			{isExpanded && folder.children && folder.children.length > 0 && <ExpandedSubfolders folders={folder.children} />}
		</motion.div>
	);
}
