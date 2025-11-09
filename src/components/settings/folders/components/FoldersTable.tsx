import {
	ArrowUpDown,
	AudioLines,
	Calendar,
	EraserIcon,
	Eye,
	FileText,
	Filter,
	FolderIcon,
	Heart,
	Image,
	Info,
	RefreshCw,
	SlidersHorizontal,
	Star,
	Video,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FolderIndexStatusBadge, type IndexStatus } from '../folder-card-index-status-badge';
import { getFolderIndexStatus } from '../folder-utils';
import { MicroCell } from './MicroCell';

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

	const getParentName = useCallback(
		(folder: any) => {
			if (!folder?.parentId) return null;
			const parent = folders.find((f: any) => f.id === folder.parentId);
			return parent?.name ?? null;
		},
		[folders]
	);

	// Función para obtener el valor de ordenación
	const getSortValue = useCallback((folder: any, field: string) => {
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
	}, []);

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
				const parentName = getParentName(folder)?.toLowerCase();
				const matchesParent = parentName?.includes(searchText);
				if (!(matchesName || matchesParent)) {
					return false;
				}
			}

			// Filtro por estado
			switch (filterStatus) {
				case 'indexed':
					return folder.lastIndexed;
				case 'never':
					return !folder.lastIndexed;
				case 'favorite':
					return folder.isFavorite;
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
	}, [orderedFolders, filterText, filterStatus, sortBy, sortDirection, getSortValue, getParentName]);

	// Función para obtener color de estado (ampliada)
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'indexed':
				return 'text-emerald-600';
			case 'never':
				return 'text-orange-600';
			case 'processing':
				return 'text-blue-600';
			case 'pending':
				return 'text-blue-600';
			case 'outdated':
				return 'text-amber-600';
			case 'not_found':
			case 'error':
				return 'text-red-600';
			default:
				return 'text-muted-foreground';
		}
	};

	// Mapa de estado a tono visual de MicroCell
	const getStatusTone = (status: string): 'default' | 'info' | 'success' | 'warning' | 'danger' => {
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
	};

	const getSortIcon = (field: string) => {
		if (sortBy !== field) return null;
		return <ArrowUpDown className="ml-1 inline-block h-3 w-3" />;
	};

	return (
		<div className="flex flex-col gap-3">
			{/* Toolbar de filtrado y ordenación */}
			<div className="flex flex-wrap items-center gap-2">
				<Input
					className="max-w-xs"
					placeholder="Buscar carpeta..."
					type="search"
					value={filterText}
					onChange={(e) => setFilterText(e.target.value)}
				/>
				<ToggleGroup
					className="justify-start"
					type="single"
					value={filterStatus}
					onValueChange={(val) => val && setFilterStatus(val as any)}
				>
					<ToggleGroupItem className="text-xs" value="all">
						Todas
					</ToggleGroupItem>
					<ToggleGroupItem className="text-xs" value="indexed">
						Indexadas
					</ToggleGroupItem>
					<ToggleGroupItem className="text-xs" value="never">
						Sin indexar
					</ToggleGroupItem>
					<ToggleGroupItem className="text-xs" value="favorite">
						Favoritas
					</ToggleGroupItem>
				</ToggleGroup>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="gap-1.5" size="sm" variant="outline">
							<SlidersHorizontal className="h-4 w-4" />
							Ordenar
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => handleSort('name')}>
							Nombre {sortBy === 'name' && `(${sortDirection === 'asc' ? '↑' : '↓'})`}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleSort('lastIndexed')}>
							Última indexación {sortBy === 'lastIndexed' && `(${sortDirection === 'asc' ? '↑' : '↓'})`}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleSort('images')}>
							Imágenes {sortBy === 'images' && `(${sortDirection === 'asc' ? '↑' : '↓'})`}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleSort('videos')}>
							Videos {sortBy === 'videos' && `(${sortDirection === 'asc' ? '↑' : '↓'})`}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Tabla */}
			<ScrollArea className="h-[calc(100vh-28rem)]">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-8">#</TableHead>
							<TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
								Carpeta {getSortIcon('name')}
							</TableHead>
							<TableHead className="cursor-pointer text-center" onClick={() => handleSort('images')}>
								<Image className="mx-auto h-4 w-4" />
							</TableHead>
							<TableHead className="cursor-pointer text-center" onClick={() => handleSort('videos')}>
								<Video className="mx-auto h-4 w-4" />
							</TableHead>
							<TableHead className="text-center">Estado</TableHead>
							<TableHead className="cursor-pointer text-center" onClick={() => handleSort('lastIndexed')}>
								<Calendar className="mx-auto h-4 w-4" />
							</TableHead>
							<TableHead className="text-center">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={7}>
									<div className="flex flex-col items-center gap-2 text-muted-foreground">
										<Filter className="h-8 w-8 opacity-50" />
										<p className="text-sm">No se encontraron carpetas con los filtros aplicados</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							rows.map((folder, index) => {
								const isSelected = folder.id === selectedFolder;
								const indexStatus = getFolderIndexStatus(folder);
								const progress = progressByFolder[folder.id];
								const isCurrentlyReindexing = globalCurrentFolderId === folder.id;
								const parentName = getParentName(folder);
								const tone = getStatusTone(indexStatus);

								return (
									<TableRow
										key={folder.id}
										className={cn(
											'cursor-pointer transition-colors hover:bg-muted/50',
											isSelected && 'bg-muted',
											isCurrentlyReindexing && 'bg-blue-50/50 dark:bg-blue-950/20'
										)}
										onClick={() => onFolderClick(folder.id)}
									>
										<TableCell className="font-mono text-muted-foreground text-xs">{index + 1}</TableCell>
										<TableCell>
											<div className="flex items-start gap-2">
												<FolderIcon
													className={cn(
														'mt-0.5 h-4 w-4 flex-shrink-0',
														folder.isFavorite ? 'text-yellow-600' : 'text-muted-foreground'
													)}
												/>
												<div className="flex flex-col gap-0.5">
													<div className="flex items-center gap-1.5">
														<span className="font-medium text-sm">{folder.name}</span>
														{folder.isFavorite && <Heart className="h-3 w-3 fill-yellow-600 text-yellow-600" />}
													</div>
													{parentName && (
														<div className="flex items-center gap-1 text-muted-foreground text-xs">
															<FolderIcon className="h-3 w-3" />
															<span>{parentName}</span>
														</div>
													)}
													<span className="text-muted-foreground/75 text-xs">{folder.path}</span>
												</div>
											</div>
										</TableCell>
										<TableCell className="text-center">
											<MicroCell tone={folder.totalImages > 0 ? 'success' : 'default'}>
												<div className="flex items-center justify-center gap-1 text-xs">
													<Image className="h-3 w-3" />
													<span className="font-medium">{folder.totalImages ?? folder.imageCount ?? 0}</span>
												</div>
											</MicroCell>
										</TableCell>
										<TableCell className="text-center">
											<MicroCell tone={folder.totalVideos > 0 ? 'info' : 'default'}>
												<div className="flex items-center justify-center gap-1 text-xs">
													<Video className="h-3 w-3" />
													<span className="font-medium">{folder.totalVideos ?? folder.videoCount ?? 0}</span>
												</div>
											</MicroCell>
										</TableCell>
										<TableCell className="text-center">
											<FolderIndexStatusBadge status={indexStatus as IndexStatus} />
										</TableCell>
										<TableCell className="text-center">
											{folder.lastIndexed ? (
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
															<Calendar className="h-3 w-3" />
															<span>{new Date(folder.lastIndexed).toLocaleDateString()}</span>
														</div>
													</TooltipTrigger>
													<TooltipContent>
														<p className="text-xs">{new Date(folder.lastIndexed).toLocaleString()}</p>
													</TooltipContent>
												</Tooltip>
											) : (
												<span className="text-muted-foreground/50 text-xs">Nunca</span>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center justify-center gap-1">
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															className="h-8 w-8"
															disabled={isGloballyProcessing}
															size="sm"
															variant="ghost"
															onClick={(e) => {
																e.stopPropagation();
																onReindex(folder.id);
															}}
														>
															<RefreshCw className={cn('h-3.5 w-3.5', isCurrentlyReindexing && 'animate-spin')} />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p className="text-xs">Reindexar carpeta</p>
													</TooltipContent>
												</Tooltip>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															className="h-8 w-8"
															size="sm"
															variant="ghost"
															onClick={(e) => {
																e.stopPropagation();
																onFolderClick(folder.id);
															}}
														>
															<Eye className="h-3.5 w-3.5" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p className="text-xs">Ver detalles</p>
													</TooltipContent>
												</Tooltip>
											</div>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</ScrollArea>

			{/* Info de filtros */}
			{(filterText || filterStatus !== 'all') && (
				<div className="flex items-center justify-between rounded-sm border bg-muted/30 px-3 py-2">
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<Info className="h-4 w-4" />
						<span>
							Mostrando {rows.length} de {orderedFolders.length} carpetas
						</span>
					</div>
					<Button
						className="h-7 gap-1.5"
						size="sm"
						variant="ghost"
						onClick={() => {
							setFilterText('');
							setFilterStatus('all');
						}}
					>
						<EraserIcon className="h-3.5 w-3.5" />
						Limpiar filtros
					</Button>
				</div>
			)}

			{/* Progreso si hay reindexación activa */}
			{isGloballyProcessing && globalCurrentFolderId && (
				<div className="rounded-sm border bg-blue-50/50 p-3 dark:bg-blue-950/20">
					<div className="mb-2 flex items-center gap-2 text-blue-600 text-sm dark:text-blue-400">
						<RefreshCw className="h-4 w-4 animate-spin" />
						<span className="font-medium">
							Reindexando:{' '}
							{folders.find((f: any) => f.id === globalCurrentFolderId)?.name || 'Carpeta desconocida'}
						</span>
					</div>
					{progressByFolder[globalCurrentFolderId] && (
						<>
							<Progress className="mb-2" value={progressByFolder[globalCurrentFolderId].percentage || 0} />
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span>
									{progressByFolder[globalCurrentFolderId].current} / {progressByFolder[globalCurrentFolderId].total}{' '}
									archivos
								</span>
								<span>{progressByFolder[globalCurrentFolderId].percentage?.toFixed(1)}%</span>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
