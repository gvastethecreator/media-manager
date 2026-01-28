import {
	AlertCircle,
	ArrowUpDown,
	AudioLines,
	Calendar,
	Eye,
	FileText,
	Filter,
	Folder,
	FolderIcon,
	Heart,
	Image,
	RefreshCw,
	Star,
	Trash2,
	Video,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FolderIndexStatusBadge, type IndexStatus } from '../folder-card-index-status-badge';
import { getFolderIndexStatus } from '../folder-utils';
import { computeIsReindexing } from '../utils/is-reindexing';
import { getStatusMessage } from '../utils/status-message';
import { MicroCell } from './micro-cell';
import { EmptyFoldersState } from './ui-primitives';

/**
 * Obtiene el valor de ordenación para una carpeta según el campo
 */
function getSortValue(folder: any, field: string): string | number {
	switch (field) {
		case 'name':
			return folder.name?.toLowerCase() || '';
		case 'lastIndexed':
			return folder.lastIndexed ? new Date(folder.lastIndexed).getTime() : 0;
		case 'images':
			return folder.totalImages ?? folder.imageCount ?? 0;
		case 'videos':
			return folder.totalVideos ?? folder.videoCount ?? 0;
		default:
			return '';
	}
}

/**
 * Obtiene el nombre de la carpeta padre
 */
function getParentName(folder: any, folders: any[]): string | null {
	if (!folder?.parentId) return null;
	const parent = folders.find((f: any) => f.id === folder.parentId);
	return parent?.name ?? null;
}

/**
 * Obtiene color CSS para el estado de indexación
 */
function getStatusColor(status: string): string {
	switch (status) {
		case 'indexed':
			return 'text-success';
		case 'never':
			return 'text-warning';
		case 'processing':
		case 'pending':
			return 'text-primary';
		case 'outdated':
			return 'text-warning';
		case 'not_found':
		case 'error':
			return 'text-destructive';
		default:
			return 'text-muted-foreground';
	}
}

/**
 * Mapea estado a tono visual para MicroCell
 */
function getStatusTone(status: string): 'default' | 'info' | 'success' | 'warning' | 'danger' {
	switch (status) {
		case 'indexed':
			return 'success';
		case 'processing':
		case 'pending':
			return 'info';
		case 'outdated':
			return 'warning';
		case 'error':
		case 'not_found':
			return 'danger';
		default:
			return 'default';
	}
}

/**
 * Formatea fecha para mostrar en UI
 */
function formatDate(date: string | Date | null): string {
	if (!date) return '—';
	const d = new Date(date);
	return d.toLocaleDateString('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

interface FoldersTableProps {
	orderedFolders: any[];
	folders: any[];
	selectedFolder: string | null;
	progressByFolder: Record<string, any>;
	processStatus: any;
	isProcessing: boolean;
	isGloballyProcessing: boolean;
	globalCurrentFolderId: string | null | undefined;
	onFolderClick: (id: string) => void;
	onReindex: (id: string) => void;
}

/**
 * Vista de tabla para carpetas con filtros y ordenación
 */
export function FoldersTable({
	orderedFolders,
	folders,
	selectedFolder,
	progressByFolder,
	processStatus,
	isProcessing,
	isGloballyProcessing,
	globalCurrentFolderId,
	onFolderClick,
	onReindex,
}: FoldersTableProps) {
	// Estados para herramientas de tabla
	const [sortBy, setSortBy] = useState<'name' | 'lastIndexed' | 'images' | 'videos'>('name');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [filterText, setFilterText] = useState('');
	const [filterStatus, setFilterStatus] = useState<'all' | 'indexed' | 'never' | 'favorite'>('all');

	const getParentNameMemo = useCallback((folder: any) => getParentName(folder, folders), [folders]);

	// Función para manejar ordenación
	const handleSort = useCallback(
		(field: 'name' | 'lastIndexed' | 'images' | 'videos') => {
			if (sortBy === field) {
				setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			} else {
				setSortBy(field);
				setSortDirection('asc');
			}
		},
		[sortBy]
	);

	// Filtrado y ordenación de filas
	const rows = useMemo(() => {
		const filtered = orderedFolders.filter((folder) => {
			// Filtro por texto
			if (filterText) {
				const searchText = filterText.toLowerCase();
				const matchesName = folder.name?.toLowerCase().includes(searchText);
				const parentName = getParentName(folder, folders)?.toLowerCase();
				const matchesParent = parentName?.includes(searchText);
				if (!(matchesName || matchesParent)) {
					return false;
				}
			}

			// Filtro por estado
			switch (filterStatus) {
				case 'indexed':
					return folder.lastIndexed != null;
				case 'never':
					return folder.lastIndexed == null;
				case 'favorite':
					return folder.isFavorite === true;
				default:
					return true;
			}
		});

		// Ordenación
		filtered.sort((a, b) => {
			const aVal = getSortValue(a, sortBy);
			const bVal = getSortValue(b, sortBy);

			let comparison = 0;
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				comparison = aVal.localeCompare(bVal);
			} else if (typeof aVal === 'number' && typeof bVal === 'number') {
				comparison = aVal - bVal;
			}

			return sortDirection === 'desc' ? -comparison : comparison;
		});

		return filtered;
	}, [orderedFolders, filterText, filterStatus, sortBy, sortDirection, folders]);

	return (
		<div className="p-2">
			{/* Herramientas de tabla */}
			<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<Input
						className="max-w-sm border-border/40 focus:border-primary"
						onChange={(e) => setFilterText(e.target.value)}
						placeholder="Buscar carpetas..."
						value={filterText}
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm" variant="outline">
								<Filter className="mr-2 h-4 w-4" />
								{filterStatus === 'all'
									? 'Todos'
									: filterStatus === 'indexed'
										? 'Indexadas'
										: filterStatus === 'never'
											? 'Sin indexar'
											: 'Favoritas'}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem onClick={() => setFilterStatus('all')}>
								<Eye className="mr-2 h-4 w-4" />
								Mostrar todas
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus('indexed')}>
								<Folder className="mr-2 h-4 w-4 text-success" />
								Solo indexadas
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus('never')}>
								<Folder className="mr-2 h-4 w-4 text-warning" />
								Sin indexar
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus('favorite')}>
								<Heart className="mr-2 h-4 w-4 text-destructive" />
								Favoritas
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="text-muted-foreground text-sm">
					{rows.length} de {orderedFolders.length} carpetas
				</div>
			</div>

			{/* Tabla */}
			<div className="overflow-hidden border border-border/30">
				<Table>
					<TableHeader>
						<TableRow className="border-b bg-muted/20 hover:bg-muted/30">
							<TableHead className="min-w-[300px] font-semibold text-[13px]">
								<Button
									className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
									onClick={() => handleSort('name')}
									size="sm"
									variant="ghost"
								>
									Carpeta
									<ArrowUpDown
										className={cn(
											'ml-2 h-3.5 w-3.5 transition-colors',
											sortBy === 'name' ? 'text-primary' : 'text-muted-foreground'
										)}
									/>
								</Button>
							</TableHead>
							<TableHead className="w-44 font-semibold text-[13px]">
								<Button
									className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
									onClick={() => handleSort('lastIndexed')}
									size="sm"
									variant="ghost"
								>
									<Calendar className="mr-1.5 h-3.5 w-3.5" />
									Estado
									<ArrowUpDown
										className={cn(
											'ml-2 h-3.5 w-3.5 transition-colors',
											sortBy === 'lastIndexed' ? 'text-primary' : 'text-muted-foreground'
										)}
									/>
								</Button>
							</TableHead>
							<TableHead className="w-28 text-center font-semibold text-[13px]">
								<Button
									className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
									onClick={() => handleSort('images')}
									size="sm"
									variant="ghost"
								>
									<Image className="mr-1 h-3.5 w-3.5" />
									Medios
									<ArrowUpDown
										className={cn(
											'ml-1.5 h-3.5 w-3.5 transition-colors',
											sortBy === 'images' ? 'text-primary' : 'text-muted-foreground'
										)}
									/>
								</Button>
							</TableHead>
							<TableHead className="w-32 text-right font-semibold text-[13px]">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell className="py-12 text-center text-muted-foreground" colSpan={4}>
									{filterText || filterStatus !== 'all' ? (
										<div className="space-y-4">
											<Folder className="mx-auto h-12 w-12 text-muted-foreground/30" />
											<div className="space-y-2">
												<p className="font-medium">No se encontraron carpetas</p>
												<p className="text-sm">No hay carpetas que coincidan con los filtros aplicados</p>
											</div>
											<Button
												className="mt-4"
												onClick={() => {
													setFilterText('');
													setFilterStatus('all');
												}}
												variant="outline"
											>
												Limpiar filtros
											</Button>
										</div>
									) : (
										<EmptyFoldersState />
									)}
								</TableCell>
							</TableRow>
						) : (
							rows.map((folder: any) => {
								const parentName = getParentNameMemo(folder);
								const status = getFolderIndexStatus(folder);
								const isSelected = selectedFolder === folder.id;
								const rowProgress =
									(progressByFolder[folder.id]?.progress as number | undefined) ??
									(processStatus?.folderId === folder.id ? processStatus?.progress : undefined);
								const disabled = isGloballyProcessing
									? globalCurrentFolderId !== folder.id
									: Boolean(progressByFolder[folder.id]?.isProcessing) || isProcessing;
								const hasError = Boolean(folder.error);

								return (
									<TableRow
										className={cn(
											'transition-all hover:bg-muted/40',
											isSelected && 'border-l-2 border-l-primary bg-primary/5',
											hasError && 'border-l-2 border-l-destructive bg-destructive/5'
										)}
										data-state={isSelected ? 'selected' : undefined}
										key={folder.id}
									>
										<TableCell className="max-w-[420px] py-2.5">
											<MicroCell className="bg-background">
												<div className="flex items-center gap-2.5 text-[13px]">
													{/* Indentación visual para jerarquía */}
													{folder._hierarchyLevel > 0 && (
														<div
															className="flex items-center"
															style={{ marginLeft: `${folder._hierarchyLevel * 16}px` }}
														>
															<div className="mr-2 h-3.5 w-px bg-border" />
															<div className="mr-2 h-px w-2.5 bg-border" />
														</div>
													)}
													<div className="relative">
														{folder.emoji ? (
															<div className="flex h-8 w-8 items-center justify-center bg-primary/5 text-xs">
																{folder.emoji}
															</div>
														) : (
															<div className="flex h-8 w-8 items-center justify-center bg-primary/5">
																<FolderIcon
																	className={cn(
																		'h-4 w-4 text-primary',
																		folder._hierarchyLevel > 0 && 'text-primary/70'
																	)}
																/>
															</div>
														)}
														{hasError && <AlertCircle className="absolute -top-1 -right-1 h-3 w-3 text-destructive" />}
													</div>
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span
																className={cn(
																	'truncate font-medium text-[13px]',
																	folder._hierarchyLevel > 0 && 'text-[12px] text-muted-foreground'
																)}
															>
																{folder.name}
															</span>
															{folder.isFavorite && (
																<Star className="h-3 w-3 fill-amber-500 text-warning dark:fill-amber-400 dark:text-amber-400" />
															)}
															{folder._isOrphan && (
																<Badge className="text-[11px]" variant="destructive">
																	Huérfana
																</Badge>
															)}
														</div>
														{parentName && (
															<div className="truncate text-[12px] text-muted-foreground">
																{parentName} / {folder.name}
															</div>
														)}
													</div>
												</div>
											</MicroCell>
										</TableCell>
										<TableCell className="py-2.5">
											{(() => {
												const indexStatus = status as IndexStatus;
												const isReindexing = computeIsReindexing({
													folderId: folder.id,
													processStatus,
													isGloballyProcessing,
													globalCurrentFolderId,
													isProcessingFlag: Boolean(progressByFolder[folder.id]?.isProcessing) || isProcessing,
												});
												const statusMsg = getStatusMessage(isReindexing, false, isProcessing);
												return (
													<MicroCell tone={getStatusTone(indexStatus)}>
														<div className="flex items-center gap-2">
															<FolderIndexStatusBadge lastIndexed={folder.lastIndexed} status={indexStatus} />
															{statusMsg && <span className="text-[11px] text-muted-foreground">{statusMsg}</span>}
															<Tooltip>
																<TooltipTrigger asChild>
																	<span className="cursor-help text-[11px] text-muted-foreground">
																		{formatDate(folder.lastIndexed)}
																	</span>
																</TooltipTrigger>
																<TooltipContent>
																	{folder.lastIndexed
																		? `Indexado el ${formatDate(folder.lastIndexed)}`
																		: 'Nunca indexado'}
																</TooltipContent>
															</Tooltip>
														</div>
													</MicroCell>
												);
											})()}
										</TableCell>
										<TableCell className="py-2.5 text-center text-[13px]">
											<MicroCell className="inline-flex">
												<div className="flex items-center justify-center gap-3">
													<div className="flex items-center gap-1.5">
														<Image className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="font-medium text-[12px]">
															{folder.totalImages ?? folder.imageCount ?? 0}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<Video className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="font-medium text-[12px]">
															{folder.totalVideos ?? folder.videoCount ?? 0}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<AudioLines className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="font-medium text-[12px]">
															{folder.totalAudio ?? folder.audioCount ?? 0}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<FileText className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="font-medium text-[12px]">
															{folder.totalDocuments ?? folder.documentCount ?? 0}
														</span>
													</div>
												</div>
											</MicroCell>
										</TableCell>
										<TableCell className="py-2.5 text-right">
											<MicroCell className="inline-flex">
												<div className="flex justify-end gap-1.5">
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																className="h-7 w-7 p-0 shadow-sm transition-all hover:shadow-md"
																disabled={disabled}
																onClick={() => onReindex(folder.id)}
																size="sm"
																variant="outline"
															>
																<RefreshCw className={cn('h-3 w-3', disabled && 'opacity-50')} />
															</Button>
														</TooltipTrigger>
														<TooltipContent>Reindexar carpeta</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																className="h-7 w-7 p-0 shadow-sm transition-all hover:shadow-md"
																onClick={() => onFolderClick(folder.id)}
																size="sm"
																variant={isSelected ? 'destructive' : 'outline'}
															>
																<Trash2 className="h-3 w-3" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>{isSelected ? 'Confirmar eliminación' : 'Eliminar carpeta'}</TooltipContent>
													</Tooltip>
												</div>
											</MicroCell>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
