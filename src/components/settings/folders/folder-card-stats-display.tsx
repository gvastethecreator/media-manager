import { File, FileText, Folder, Image, Music, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils/format.utils';
import type { FolderStatsResponse } from '@/types/folders';
import type { ExtendedFolder } from './folder-types';

interface FolderStatsDisplayProps {
	folder: ExtendedFolder;
	folderStats?: FolderStatsResponse;
}

function FileTypeBadges({ folderStats }: { folderStats?: FolderStatsResponse }) {
	const stats = [
		{ count: folderStats?.totalImages, icon: Image, label: 'images' },
		{ count: folderStats?.totalVideos, icon: Video, label: 'videos' },
		{ count: folderStats?.totalAudio, icon: Music, label: 'audio' },
		{ count: folderStats?.totalDocuments, icon: FileText, label: 'documents' },
		{ count: folderStats?.totalOthers, icon: File, label: 'others' },
	];

	return (
		<>
			{stats.map(({ count, icon: Icon, label }) => {
				if (!(count && count > 0)) {
					return null;
				}
				return (
					<Badge className="flex h-4 items-center gap-1 px-1.5 text-[10px]" key={label} variant="secondary">
						<Icon className="h-2.5 w-2.5" />
						{count}
					</Badge>
				);
			})}
		</>
	);
}

export function FolderStatsDisplay({ folder, folderStats }: FolderStatsDisplayProps) {
	return (
		<div className="min-w-0 flex-1 space-y-1">
			<div className="flex items-center">
				<span className="truncate text-muted-foreground text-xs">{folder.path}</span>
			</div>

			{/* Estadísticas por tipo de archivo */}
			<div className="space-y-1">
				<div className="flex flex-wrap items-center gap-1">
					<FileTypeBadges folderStats={folderStats} />

					{/* Subcarpetas */}
					{folder.children && folder.children.length > 0 && (
						<Badge className="flex h-4 items-center gap-1 px-1.5 text-[10px]" variant="outline">
							<Folder className="h-2.5 w-2.5" />
							{folder.children.length}
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-1">
					<Badge className="h-4 px-1 text-[10px]" variant="secondary">
						{formatBytes(Number(folderStats?.totalSize || 0))}
					</Badge>
				</div>
			</div>
		</div>
	);
}
