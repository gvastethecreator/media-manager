import {
	AlertCircle,
	Check,
	ChevronDown,
	ChevronRight,
	Edit2,
	File,
	FileText,
	Folder,
	Heart,
	Image,
	Music,
	RefreshCw,
	Smile,
	Trash2,
	Video,
	X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFolderStats } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { FolderStatsResponse } from '@/types/folders';
import { FolderIndexStatusBadge, type IndexStatus } from './folder-index-status-badge';
import { FolderProgressDetails } from './folder-progress-details';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';

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
		isFavorite: folder.isFavorite || false,
	});

	// Hook para obtener estadísticas detalladas
	const childStatsQuery = useFolderStats(folder.id || '');
	const folderStats = childStatsQuery.data as FolderStatsResponse | undefined;

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
			isFavorite: folder.isFavorite || false,
		});
		setIsEditing(false);
		setShowEmojiPicker(false);
	}, [folder.emoji, folder.description, folder.isFavorite]);

	// Función para manejar selección de emoji
	const handleEmojiSelect = useCallback((emoji: string) => {
		setEditValues((prev) => ({ ...prev, emoji }));
		setShowEmojiPicker(false);
	}, []);

	// Función helper para encontrar el nombre de la carpeta padre
	const getParentFolderName = useCallback(() => {
		if (!folder.parentId || !allFolders.length) return null;
		const parentFolder = allFolders.find((f) => f.id === folder.parentId);
		return parentFolder?.name || null;
	}, [folder.parentId, allFolders]);
	// Determinar si esta carpeta está siendo procesada actualmente
	const isReindexing = isProcessing && processStatus?.folderId === folder.id;

	// Verificar explícitamente si el proceso está completado
	const isComplete =
		(!isProcessing && processStatus?.folderId === folder.id && processStatus?.phase === 'complete') ||
		(!isProcessing && processStatus?.folderId === folder.id && processStatus?.progress === 100) ||
		(processStatus?.phase === 'complete' && processStatus?.folderId === folder.id) ||
		(processStatus?.progress === 100 && processStatus?.phase === 'metadata' && processStatus?.folderId === folder.id);

	const indexStatus = getFolderIndexStatus(folder);

	// Estado local para tracking
	const [lastProgress, setLastProgress] = useState<number>(0);
	const [showCompleteAnimation, setShowCompleteAnimation] = useState<boolean>(false);

	// Actualizar el progreso cuando cambie el estado
	useEffect(() => {
		const isActiveProcess = isReindexing && processStatus?.folderId === folder.id;

		if (isActiveProcess && typeof processStatus?.progress === 'number') {
			setLastProgress(processStatus.progress);

			// Si el progreso alcanza el 100%, mostrar animación de completado
			if (processStatus.progress >= 100) {
				setShowCompleteAnimation(true);

				// Ocultar la animación después de un tiempo
				const timer = setTimeout(() => {
					setShowCompleteAnimation(false);
				}, 3000);

				return () => clearTimeout(timer);
			}
		} else if (isComplete) {
			setLastProgress(100);
			setShowCompleteAnimation(true);

			// Ocultar la animación después de un tiempo
			const timer = setTimeout(() => {
				setShowCompleteAnimation(false);
			}, 3000);

			return () => clearTimeout(timer);
		}

		// Si no está procesando ni completo, asegurarse de que no mostramos animación
		if (!isReindexing && !isComplete) {
			setShowCompleteAnimation(false);
		}
	}, [isReindexing, isComplete, processStatus, folder.id]);

	// Obtener mensaje de estado
	const getStatusMessage = useCallback(() => {
		if (!isReindexing && !showCompleteAnimation) {
			return null;
		}

		if (!isProcessing && showCompleteAnimation) {
			return (
				<Badge
					variant="outline"
					className="ml-1 text-[9px] h-3.5 px-1 py-0 text-emerald-500 border-emerald-200 bg-emerald-50"
				>
					Completado
				</Badge>
			);
		}

		return (
			<Badge
				variant="outline"
				className="ml-1 text-[9px] h-3.5 px-1 py-0 text-blue-500 border-blue-200 bg-blue-50 animate-pulse"
			>
				Procesando...
			</Badge>
		);
	}, [isReindexing, showCompleteAnimation, isProcessing]);

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
					'overflow-hidden transition-all border-0',
					isReindexing && 'ring-1 ring-primary/20',
					showCompleteAnimation && 'ring-1 ring-emerald-400/20'
				)}
			>
				{/* Indicador visual de procesamiento */}
				{(isReindexing || showCompleteAnimation) && (
					<div
						className={cn(
							'absolute inset-x-0 top-0 h-0.5 overflow-hidden',
							showCompleteAnimation ? 'bg-emerald-400/50' : 'bg-primary/50'
						)}
					>
						<div
							className={cn('h-full', showCompleteAnimation ? 'bg-emerald-400' : 'bg-primary animate-pulse')}
							style={{ width: `${lastProgress}%` }}
						/>
					</div>
				)}

				<CardContent className="p-3">
					<div className="space-y-2">
						{/* Cabecera de la carpeta */}
						<div className="flex items-center justify-between">
							<div className="flex flex-col gap-0.5 flex-1">
								<div className="flex items-center gap-1">
									{/* Emoji editable */}
									{isEditing ? (
										<div className="relative">
											<Button
												size="icon"
												variant="ghost"
												className="h-6 w-6 text-sm border-dashed border"
												onClick={() => setShowEmojiPicker(!showEmojiPicker)}
											>
												{editValues.emoji || <Smile className="h-3 w-3" />}
											</Button>
											{showEmojiPicker && (
												<div className="absolute top-7 left-0 z-50">
													<EmojiPicker onEmojiSelect={handleEmojiSelect} compact={true} />
												</div>
											)}
										</div>
									) : (
										<span className="text-sm">{folder.emoji || '🗂️'}</span>
									)}

									{/* Nombre de la carpeta */}
									<span className="font-medium text-sm">{folder.name}</span>

									{/* Botón de favorito */}
									{isEditing ? (
										<Button
											size="icon"
											variant="ghost"
											className="h-5 w-5"
											onClick={() => setEditValues((prev) => ({ ...prev, isFavorite: !prev.isFavorite }))}
										>
											<Heart
												className={cn(
													'h-3 w-3',
													editValues.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
												)}
											/>
										</Button>
									) : folder.isFavorite ? (
										<Heart className="h-3 w-3 fill-red-500 text-red-500" />
									) : null}

									{getStatusMessage()}
								</div>

								{/* Descripción editable */}
								{isEditing ? (
									<Textarea
										value={editValues.description}
										onChange={(e) => setEditValues((prev) => ({ ...prev, description: e.target.value }))}
										placeholder="Descripción de la carpeta..."
										className="text-xs resize-none h-16 ml-5"
										maxLength={200}
									/>
								) : folder.description ? (
									<div className="text-xs text-muted-foreground ml-5 italic">{folder.description}</div>
								) : null}

								{/* Información del padre */}
								{getParentFolderName() && (
									<div className="flex items-center gap-1 text-xs text-muted-foreground ml-5">
										<span>en</span>
										<ChevronRight className="h-3 w-3" />
										<span className="font-medium">{getParentFolderName()}</span>
									</div>
								)}
							</div>

							<div className="flex items-center gap-1">
								{/* Botones de edición */}
								{isEditing ? (
									<>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														size="icon"
														variant="ghost"
														className="h-6 w-6 text-green-600 hover:bg-green-50"
														onClick={handleSaveEdit}
														disabled={isGloballyProcessing}
													>
														<Check className="h-3.5 w-3.5" />
													</Button>
												</TooltipTrigger>
												<TooltipContent className="text-xs">Guardar cambios</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														size="icon"
														variant="ghost"
														className="h-6 w-6 text-red-600 hover:bg-red-50"
														onClick={handleCancelEdit}
														disabled={isGloballyProcessing}
													>
														<X className="h-3.5 w-3.5" />
													</Button>
												</TooltipTrigger>
												<TooltipContent className="text-xs">Cancelar edición</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</>
								) : (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													size="icon"
													variant="ghost"
													className="h-6 w-6 hover:bg-accent hover:text-accent-foreground"
													onClick={() => setIsEditing(true)}
													disabled={isGloballyProcessing || !onUpdateFolder}
												>
													<Edit2 className="h-3.5 w-3.5" />
												</Button>
											</TooltipTrigger>
											<TooltipContent className="text-xs">Editar carpeta</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}

								{/* Botón expandir/contraer subcarpetas */}
								{folder.children && folder.children.length > 0 && onToggleExpanded && (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													size="icon"
													variant="ghost"
													className="h-6 w-6 hover:bg-accent hover:text-accent-foreground"
													onClick={() => {
														console.log('Toggling expansion for folder:', folder.id, 'current state:', isExpanded);
														onToggleExpanded(folder.id!);
													}}
													disabled={isGloballyProcessing || !folder.id}
												>
													{isExpanded ? (
														<ChevronDown className="h-3.5 w-3.5" />
													) : (
														<ChevronRight className="h-3.5 w-3.5" />
													)}
												</Button>
											</TooltipTrigger>
											<TooltipContent className="text-xs">
												{isExpanded ? 'Contraer subcarpetas' : `Expandir ${folder.children.length} subcarpetas`}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}

								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center gap-1 cursor-pointer">
												<Switch
													checked={folder.autoReindex}
													onCheckedChange={(checked) => {
														if (!folder.id) {
															console.error('[FolderCard] ❌ Error: folder.id is undefined for auto-reindex', {
																folder,
															});
															return;
														}
														onToggleAutoReindex(folder.id, checked);
													}}
													disabled={isGloballyProcessing || !folder.id || isEditing}
													className="scale-75"
												/>
												<span className="text-[10px] text-muted-foreground">Auto</span>
											</div>
										</TooltipTrigger>
										<TooltipContent className="text-xs">
											{folder.autoReindex ? 'Desactivar reindexado automático' : 'Activar reindexado automático'}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="icon"
												variant="ghost"
												className="h-6 w-6 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
												onClick={() => {
													if (!folder.id) {
														console.error('[FolderCard] ❌ Error: folder.id is undefined', { folder });
														return;
													}
													onReindex(folder.id);
												}}
												disabled={isGloballyProcessing || isReindexing || !folder.id}
											>
												<RefreshCw
													className={cn(
														'h-3.5 w-3.5 transition-transform',
														isProcessing && processStatus.folderId === folder.id && 'animate-spin'
													)}
												/>
											</Button>
										</TooltipTrigger>
										<TooltipContent className="text-xs">
											{isReindexing ? 'Reindexando...' : 'Reindexar carpeta'}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="icon"
												variant="ghost"
												className={cn(
													'h-6 w-6 cursor-pointer transition-colors',
													selectedFolder === folder.id
														? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
														: 'hover:bg-destructive/10 hover:text-destructive'
												)}
												onClick={() => {
													if (!folder.id) {
														console.error('[FolderCard] ❌ Error: folder.id is undefined for delete', { folder });
														return;
													}
													onFolderClick(folder.id);
												}}
												disabled={isGloballyProcessing || !folder.id}
											>
												<Trash2
													className={cn(
														'h-3.5 w-3.5 transition-colors',
														selectedFolder === folder.id ? 'text-background' : 'text-muted-foreground'
													)}
												/>
											</Button>
										</TooltipTrigger>
										<TooltipContent className="text-xs">
											{selectedFolder === folder.id ? 'Confirmar eliminación' : 'Eliminar carpeta'}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>

						{/* Detalles de la carpeta */}
						<div className="flex items-center justify-between gap-1 w-full">
							<div className="w-full space-y-1">
								<div className="flex items-center">
									<span className="text-xs text-muted-foreground truncate">{folder.path}</span>
								</div>

								{/* Estadísticas por tipo de archivo */}
								<div className="flex items-center justify-between gap-2 w-full">
									<div className="flex items-center gap-1 flex-wrap">
										{/* Imágenes */}
										{(folderStats?.totalImages || 0) > 0 && (
											<Badge variant="secondary" className="text-[10px] px-1.5 h-4 flex items-center gap-1">
												<Image className="h-2.5 w-2.5" />
												{folderStats?.totalImages || 0}
											</Badge>
										)}

										{/* Videos */}
										{(folderStats?.totalVideos || 0) > 0 && (
											<Badge variant="secondary" className="text-[10px] px-1.5 h-4 flex items-center gap-1">
												<Video className="h-2.5 w-2.5" />
												{folderStats?.totalVideos || 0}
											</Badge>
										)}

										{/* Audio */}
										{(folderStats?.totalAudio || 0) > 0 && (
											<Badge variant="secondary" className="text-[10px] px-1.5 h-4 flex items-center gap-1">
												<Music className="h-2.5 w-2.5" />
												{folderStats?.totalAudio || 0}
											</Badge>
										)}

										{/* Documentos */}
										{(folderStats?.totalDocuments || 0) > 0 && (
											<Badge variant="secondary" className="text-[10px] px-1.5 h-4 flex items-center gap-1">
												<FileText className="h-2.5 w-2.5" />
												{folderStats?.totalDocuments || 0}
											</Badge>
										)}

										{/* Otros archivos */}
										{(folderStats?.totalOthers || 0) > 0 && (
											<Badge variant="secondary" className="text-[10px] px-1.5 h-4 flex items-center gap-1">
												<File className="h-2.5 w-2.5" />
												{folderStats?.totalOthers || 0}
											</Badge>
										)}

										{/* Subcarpetas */}
										{folder.children && folder.children.length > 0 && (
											<Badge variant="outline" className="text-[10px] px-1.5 h-4 flex items-center gap-1">
												<Folder className="h-2.5 w-2.5" />
												{folder.children.length}
											</Badge>
										)}
									</div>

									<div className="flex items-center gap-1">
										<Badge variant="secondary" className="text-[10px] px-1 h-4">
											{formatBytes(Number(folderStats?.totalSize || 0))}
										</Badge>
										<FolderIndexStatusBadge status={indexStatus} lastIndexed={folder.lastIndexed} />
									</div>
								</div>

								{/* Últimas 4 imágenes */}
								{folderStats?.recentImages && folderStats.recentImages.length > 0 && (
									<div className="flex items-center gap-1 mt-1">
										<span className="text-[10px] text-muted-foreground mr-1">Recientes:</span>
										<div className="flex gap-0.5">
											{folderStats.recentImages.slice(0, 4).map((image, index) => (
												<div
													key={image.id || index}
													className="w-6 h-6 rounded border overflow-hidden bg-muted flex items-center justify-center"
												>
													{image.thumbnailUrl ? (
														<img src={image.thumbnailUrl} alt={image.name} className="w-full h-full object-cover" />
													) : (
														<Image className="h-3 w-3 text-muted-foreground" />
													)}
												</div>
											))}
											{folderStats.recentImages.length > 4 && (
												<div className="w-6 h-6 rounded border bg-muted/50 flex items-center justify-center">
													<span className="text-[8px] text-muted-foreground font-medium">
														+{folderStats.recentImages.length - 4}
													</span>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Muestra error si existe */}
						{folder.error && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="mt-1"
							>
								<Alert variant="destructive" className="p-2">
									<AlertCircle className="h-3.5 w-3.5 mr-1" />
									<AlertTitle className="text-xs">Error en carpeta</AlertTitle>
									<AlertDescription className="text-xs mt-1">{folder.error}</AlertDescription>
								</Alert>
							</motion.div>
						)}

						{/* Detalles del proceso */}
						{isReindexing && (
							<div className="mt-1">
								<Progress value={lastProgress} className="h-1 my-1" />
								<FolderProgressDetails status={processStatus} isProcessing={isReindexing} className="mt-1" />
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Subcarpetas expandidas */}
			{isExpanded && folder.children && folder.children.length > 0 && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.2 }}
					className="mt-3 pl-4 border-l-2 border-border space-y-2"
				>
					{folder.children.map((child) => {
						// Hook calls need to be moved to the top level of the component
						// This line should be removed from here and the stats should be passed down as props
						const childStats = childStatsQuery.data as FolderStatsResponse | undefined;
						return (
							<div key={child.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
								<div className="flex items-center gap-2">
									<Folder className="h-3.5 w-3.5 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">{child.name}</span>
								</div>
								<div className="flex items-center gap-1">
									{/* Estadísticas por tipo */}
									{(childStats?.totalImages || 0) > 0 && (
										<Badge variant="outline" className="text-[10px] px-1 h-4 flex items-center gap-0.5">
											<Image className="h-2 w-2" />
											{childStats?.totalImages}
										</Badge>
									)}
									{(childStats?.totalVideos || 0) > 0 && (
										<Badge variant="outline" className="text-[10px] px-1 h-4 flex items-center gap-0.5">
											<Video className="h-2 w-2" />
											{childStats?.totalVideos}
										</Badge>
									)}
									<Badge variant="outline" className="text-[10px] px-1 h-4">
										{formatBytes(Number(childStats?.totalSize || 0))}
									</Badge>
								</div>
							</div>
						);
					})}
				</motion.div>
			)}
		</motion.div>
	);
}
