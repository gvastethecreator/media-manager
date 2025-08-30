import { File, FileText, Folder, Image, Music, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils/format.utils';
import type { FolderStatsResponse } from '@/types/folders';
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

function MicroProgressBar({ label, count, icon: Icon, total, color }: MicroProgressBarProps) {
	const percentage = total > 0 ? (count / total) * 100 : 0;

	return (
		<div className="group relative">
			<div className="flex h-2 items-center">
				<div className="w-full overflow-hidden rounded-full bg-muted/30">
					<div
						className={`h-full transition-all duration-300 ${color}`}
						style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
					/>
				</div>
			</div>
			<div className="-top-8 -translate-x-1/2 absolute left-1/2 z-10 rounded bg-popover px-2 py-1 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
				<Icon className="mr-1 inline h-2.5 w-2.5" />
				{count} {label}
			</div>
		</div>
	);
}

function FileTypeProgressBars({ folderStats }: { folderStats?: FolderStatsResponse }) {
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
			color: 'bg-blue-500',
		},
		{
			count: folderStats?.totalVideos || 0,
			icon: Video,
			label: 'videos',
			color: 'bg-purple-500',
		},
		{
			count: folderStats?.totalAudio || 0,
			icon: Music,
			label: 'audio',
			color: 'bg-green-500',
		},
		{
			count: folderStats?.totalDocuments || 0,
			icon: FileText,
			label: 'docs',
			color: 'bg-orange-500',
		},
		{
			count: folderStats?.totalOthers || 0,
			icon: File,
			label: 'others',
			color: 'bg-gray-500',
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
}

export function FolderStatsDisplay({ folder, folderStats }: FolderStatsDisplayProps) {
	return (
		<div className="min-w-0 flex-1 space-y-1.5">
			{/* Path compacto */}
			<div className="flex items-center">
				<span className="truncate text-[11px] text-muted-foreground">{folder.path}</span>
			</div>

			{/* Micro-progressbars por tipo de archivo */}
			<div className="space-y-1">
				<FileTypeProgressBars folderStats={folderStats} />

				{/* Métricas compactas */}
				<div className="flex items-center justify-between gap-1">
					{/* Subcarpetas */}
					{folder.children && folder.children.length > 0 && (
						<Badge className="flex h-3 items-center gap-1 px-1 text-[9px]" variant="outline">
							<Folder className="h-2 w-2" />
							{folder.children.length}
						</Badge>
					)}

					{/* Tamaño total */}
					<Badge className="h-3 px-1 text-[9px]" variant="secondary">
						{formatBytes(Number(folderStats?.totalSize || 0))}
					</Badge>
				</div>
			</div>
		</div>
	);
}
