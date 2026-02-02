import { File, FileText, Image, Music, Video } from 'lucide-react';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { FolderStatsResponse } from '@/types/folders';
import { FileTypeBadge, FolderBadge, SizeBadge, TotalFilesBadge } from './common/folder-badges';
import type { ExtendedFolder } from './folder-types';

interface FolderStatsDisplayProps {
	folder: ExtendedFolder;
	folderStats?: FolderStatsResponse;
}

interface MicroProgressBarProps {
	label: string;
	count: number;
	icon: React.ComponentType<{ className?: string }>;
	total: number;
	color: string;
}

const MicroProgressBar = memo(function MicroProgressBar({
	label,
	count,
	icon: Icon,
	total,
	color,
}: MicroProgressBarProps) {
	const percentage = useMemo(() => {
		return total > 0 ? (count / total) * 100 : 0;
	}, [count, total]);

	const widthStyle = useMemo(() => {
		return { width: `${Math.min(100, Math.max(2, percentage))}%` };
	}, [percentage]);

	return (
		<div className="group relative">
			<div className="flex h-2 items-center">
				<div className="w-full overflow-hidden rounded-full bg-muted/30 transition-all duration-200 hover:bg-muted/40">
					<div className={`h-full transition-all duration-500 ease-out ${color}`} style={widthStyle} />
				</div>
			</div>
			<div
				className={cn(
					'absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-dt-1',
					'opacity-0 transition-all duration-200 ease-out',
					'group-hover:-translate-y-1 group-hover:opacity-100'
				)}
			>
				<Icon className="mr-1 inline h-2.5 w-2.5" />
				{count} {label}
			</div>
		</div>
	);
});

const FileTypeProgressBars = memo(function FileTypeProgressBars({
	folderStats,
}: {
	folderStats?: FolderStatsResponse;
}) {
	const totalFiles =
		(folderStats?.totalImages || 0) +
		(folderStats?.totalVideos || 0) +
		(folderStats?.totalAudio || 0) +
		(folderStats?.totalDocuments || 0) +
		(folderStats?.totalOthers || 0);

	if (totalFiles === 0) return null;

	const stats = [
		{
			count: folderStats?.totalImages || 0,
			icon: Image,
			label: 'images',
			color: 'bg-primary',
		},
		{
			count: folderStats?.totalVideos || 0,
			icon: Video,
			label: 'videos',
			color: 'bg-entity-video',
		},
		{
			count: folderStats?.totalAudio || 0,
			icon: Music,
			label: 'audio',
			color: 'bg-success',
		},
		{
			count: folderStats?.totalDocuments || 0,
			icon: FileText,
			label: 'docs',
			color: 'bg-entity-document',
		},
		{
			count: folderStats?.totalOthers || 0,
			icon: File,
			label: 'others',
			color: 'bg-muted/500',
		},
	].filter((stat) => stat.count > 0);

	return (
		<div className="grid @container/content:grid-cols-3 grid-cols-2 gap-1">
			{stats.slice(0, 3).map((stat) => (
				<MicroProgressBar
					color={stat.color}
					count={stat.count}
					icon={stat.icon}
					key={stat.label}
					label={stat.label}
					total={totalFiles}
				/>
			))}
		</div>
	);
});

export const FolderStatsDisplay = memo(function FolderStatsDisplay({ folder, folderStats }: FolderStatsDisplayProps) {
	// Memoizar valores calculados para evitar recálculos innecesarios
	const memoizedStats = useMemo(() => {
		if (!folderStats) return null;

		return {
			hasImages: (folderStats.totalImages ?? 0) > 0,
			hasVideos: (folderStats.totalVideos ?? 0) > 0,
			hasAudio: (folderStats.totalAudio ?? 0) > 0,
			hasDocuments: (folderStats.totalDocuments ?? 0) > 0,
			hasOthers: (folderStats.totalOthers ?? 0) > 0,
			totalSize: Number(folderStats.totalSize || 0),
			childrenCount: folder.children?.length || 0,
		};
	}, [folderStats, folder.children]);

	// Memoizar el path para evitar re-renders innecesarios
	const folderPath = useMemo(() => folder.path, [folder.path]);

	return (
		<div className="min-w-0 flex-1 space-y-2">
			{/* Path compacto con hover */}
			<span className="truncate text-[11px] text-muted-foreground transition-colors duration-200 hover:text-muted-foreground/80">
				{folderPath}
			</span>

			{/* Micro-progressbars por tipo de archivo */}
			<div className="space-y-1.5">
				{/* Métricas compactas con mejores animaciones */}
				<div className="flex items-center justify-between gap-2">
					<div className="flex flex-wrap items-center gap-1.5">
						{/* Total de archivos - siempre visible si hay archivos */}
						<div className="fade-in-0 animate-in duration-300">
							<TotalFilesBadge folderStats={folderStats} />
						</div>

						{/* Subcarpetas con animación */}
						{memoizedStats?.childrenCount && memoizedStats.childrenCount > 0 && (
							<div className="slide-in-from-left-2 fade-in-0 animate-in delay-100 duration-300">
								<FolderBadge count={memoizedStats.childrenCount} />
							</div>
						)}

						{/* Conteos por tipo: visibles siempre si > 0 con animaciones escalonadas */}
						{memoizedStats?.hasImages && (
							<div className="slide-in-from-left-2 fade-in-0 animate-in delay-150 duration-300">
								<FileTypeBadge count={folderStats?.totalImages ?? 0} type="images" />
							</div>
						)}
						{memoizedStats?.hasVideos && (
							<div className="slide-in-from-left-2 fade-in-0 animate-in delay-200 duration-300">
								<FileTypeBadge count={folderStats?.totalVideos ?? 0} type="videos" />
							</div>
						)}
						{memoizedStats?.hasAudio && (
							<div className="slide-in-from-left-2 fade-in-0 animate-in delay-250 duration-300">
								<FileTypeBadge count={folderStats?.totalAudio ?? 0} type="audio" />
							</div>
						)}
						{memoizedStats?.hasDocuments && (
							<div className="slide-in-from-left-2 fade-in-0 animate-in delay-300 duration-300">
								<FileTypeBadge count={folderStats?.totalDocuments ?? 0} type="documents" />
							</div>
						)}
						{memoizedStats?.hasOthers && (
							<div className="slide-in-from-left-2 fade-in-0 animate-in delay-350 duration-300">
								<FileTypeBadge count={folderStats?.totalOthers ?? 0} type="others" />
							</div>
						)}
					</div>

					{/* Tamaño total con animación desde la derecha */}
					<div className="slide-in-from-right-2 fade-in-0 animate-in delay-100 duration-300">
						<SizeBadge bytes={memoizedStats?.totalSize || 0} />
					</div>
				</div>
			</div>
		</div>
	);
});
