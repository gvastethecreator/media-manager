import { Folder } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFolderStats } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import type { FolderStatsResponse } from '@/types/folders';
import { ExpandedSubfolders } from './expanded-subfolders';
import { NormalModeControls } from './folder-card-action-controls';
import { EditModeControls } from './folder-card-edit-controls';
import { FolderHeader } from './folder-card-header';
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

interface FolderCardProps {
	folder: ExtendedFolder;
	selectedFolder: string | null;
	isProcessing: boolean;
	processStatus: ExtendedProcessStatus;
	isGloballyProcessing: boolean;
	allFolders?: ExtendedFolder[]; // Para buscar información del padre
	onReindex: (folderId: string) => void;
	onToggleAutoReindex: (folderId: string, value: boolean) => void;
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
	allFolders = [],
	onReindex,
	onToggleAutoReindex,
	onFolderClick,
	getFolderIndexStatus,
	onUpdateFolder,
	onToggleExpanded,
	isExpanded = false,
}: FolderCardProps) {
	// Estados para edición
	const [isEditing, setIsEditing] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

	// Función helper para encontrar el nombre de la carpeta padre
	const getParentFolderName = useCallback(() => {
		if (!(folder.parentId && allFolders.length)) {
			return null;
		}
		const parentFolder = allFolders.find((f) => f.id === folder.parentId);
		return parentFolder?.name || null;
	}, [folder.parentId, allFolders]);

	// Estado del procesamiento
	const isReindexing = isProcessing && processStatus?.folderId === folder.id;
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
		setShowEmojiPicker(false);
	}, [onUpdateFolder, folder.id, editValues]);

	const handleCancelEdit = useCallback(() => {
		setEditValues({
			emoji: folder.emoji || '',
			description: folder.description || '',
			isFavorite: folder.isFavorite,
		});
		setIsEditing(false);
		setShowEmojiPicker(false);
	}, [folder.emoji, folder.description, folder.isFavorite]);

	const handleEmojiSelect = useCallback((emoji: string) => {
		setEditValues((prev) => ({ ...prev, emoji }));
		setShowEmojiPicker(false);
	}, []);

	const handleEditValuesChange = useCallback((updates: Partial<typeof editValues>) => {
		setEditValues((prev) => ({ ...prev, ...updates }));
	}, []);

	// Obtener mensaje de estado
	const statusMessage = getStatusMessage(isReindexing, showCompleteAnimation, isProcessing);

	return (
		<motion.div
			animate={{
				opacity: [0, 1],
				y: [20, 0],
			}}
			className={cn('group rounded-sm', selectedFolder === folder.id && 'ring-1 ring-primary')}
		>
			<Card
				className={cn(
					'overflow-hidden border-0 transition-all',
					isReindexing && 'ring-1 ring-primary/20',
					showCompleteAnimation && 'ring-1 ring-emerald-400/20'
				)}
			>
				{/* Indicador visual de procesamiento */}
				<FolderProgressIndicator
					isReindexing={isReindexing}
					lastProgress={lastProgress}
					showCompleteAnimation={showCompleteAnimation}
				/>

				<CardContent className="p-3">
					<div className="space-y-2">
						{/* Cabecera de la carpeta */}
						<FolderHeader
							editValues={editValues}
							folder={folder}
							isEditing={isEditing}
							onEditValuesChange={handleEditValuesChange}
							onEmojiSelect={handleEmojiSelect}
							onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
							parentFolderName={getParentFolderName()}
							showEmojiPicker={showEmojiPicker}
							statusMessage={statusMessage}
						/>

						{/* Detalles de la carpeta en 3 columnas */}
						<div className="grid grid-cols-[auto,1fr,auto] gap-3">
							{/* Columna 1: Thumbnail Grid */}
							<div className="flex items-start">
								{folderStats?.recentImages && folderStats.recentImages.length > 0 ? (
									<ThumbnailGrid images={folderStats.recentImages} totalImages={folderStats.totalImages || 0} />
								) : (
									<div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-muted-foreground/20 border-dashed bg-muted/30">
										<Folder className="h-6 w-6 text-muted-foreground/50" />
									</div>
								)}
							</div>

							{/* Columna 2: Información principal */}
							<FolderStatsDisplay folder={folder} folderStats={folderStats} />

							{/* Columna 3: Status y botones */}
							<div className="flex flex-col items-end gap-1">
								<FolderIndexStatusBadge lastIndexed={folder.lastIndexed} status={indexStatus} />

								<div className="flex items-center gap-1">
									{isEditing ? (
										<EditModeControls
											isDisabled={isGloballyProcessing}
											onCancel={handleCancelEdit}
											onSave={handleSaveEdit}
										/>
									) : (
										<NormalModeControls
											folder={folder}
											hasChildren={Boolean(folder.children && folder.children.length > 0)}
											isExpanded={isExpanded}
											isGloballyProcessing={isGloballyProcessing}
											isReindexing={isReindexing}
											onEdit={() => setIsEditing(true)}
											onFolderClick={onFolderClick}
											onReindex={onReindex}
											onToggleAutoReindex={onToggleAutoReindex}
											onToggleExpanded={onToggleExpanded}
											processStatus={processStatus}
											selectedFolder={selectedFolder}
										/>
									)}
								</div>
							</div>
						</div>

						{/* Muestra error si existe */}
						<FolderErrorDisplay folder={folder} />

						{/* Detalles del proceso con indicador de etapas */}
						{isReindexing && (
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
