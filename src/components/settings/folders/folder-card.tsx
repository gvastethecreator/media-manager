import { Folder } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
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
		<div className="flex items-start justify-between">
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
						{folder.emoji ? (
							<span className="text-sm">{folder.emoji}</span>
						) : (
							<Folder className="h-4 w-4 text-primary" />
						)}
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="truncate font-medium text-sm">{folder.name}</h3>
						{parentFolderName && <p className="truncate text-muted-foreground text-xs">en {parentFolderName}</p>}
					</div>
				</div>
				<div className="mt-2 flex items-center gap-2">
					<FolderIndexStatusBadge lastIndexed={folder.lastIndexed} status={indexStatus} />
					{statusMessage}
				</div>
			</div>
			<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
		</div>
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
		// Si hay estado por carpeta indicando progreso/processing, úsalo
		const perFolderActive = Boolean(processStatus?.isProcessing) || (processStatus?.progress ?? 0) > 0;
		if (perFolderActive && processStatus?.folderId === folder.id) {
			return true;
		}
		// Durante reindex global, marcar como activo la carpeta actual
		if (isGloballyProcessing) {
			return globalCurrentFolderId === folder.id;
		}
		// Fallback al flag isProcessing
		return Boolean(isProcessing && processStatus?.folderId === folder.id);
	}, [isGloballyProcessing, globalCurrentFolderId, isProcessing, processStatus, folder.id]);
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
					'h-full overflow-hidden border transition-all hover:shadow-md',
					isReindexing && 'ring-2 ring-primary/20',
					showCompleteAnimation && 'ring-2 ring-emerald-400/20'
				)}
			>
				{/* Indicador visual de procesamiento */}
				<FolderProgressIndicator
					isReindexing={isReindexing}
					lastProgress={lastProgress}
					showCompleteAnimation={showCompleteAnimation}
				/>

				<CardContent className="p-4">
					<div className="space-y-3">
						{/* Header compacto extraído */}
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

						{/* Grid de miniaturas y estadísticas */}
						<div className="flex items-center gap-3">
							{/* Thumbnail grid más pequeño */}
							<div className="flex-shrink-0">
								{folderStats?.recentImages && folderStats.recentImages.length > 0 ? (
									<div className="relative h-12 w-12">
										<ThumbnailGrid
											images={folderStats.recentImages.slice(0, 4)}
											totalImages={folderStats.totalImages || 0}
										/>
									</div>
								) : (
									<div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-muted-foreground/20 border-dashed bg-muted/30">
										<Folder className="h-5 w-5 text-muted-foreground/50" />
									</div>
								)}
							</div>

							{/* Estadísticas compactas */}
							<div className="min-w-0 flex-1">
								<FolderStatsDisplay folder={folder} folderStats={folderStats} />
							</div>
						</div>

						{/* Error display si existe */}
						<FolderErrorDisplay folder={folder} />

						{/* Detalles del proceso */}
						{(isReindexing || (processStatus?.folderId === folder.id && (processStatus?.progress ?? 0) > 0)) && (
							<FolderProcessingDetails
								isReindexing={isReindexing}
								lastProgress={lastProgress}
								processStatus={processStatus}
								subfolders={subfolders}
							/>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Subcarpetas expandidas */}
			{isExpanded && folder.children && folder.children.length > 0 && <ExpandedSubfolders folders={folder.children} />}
		</motion.div>
	);
}
