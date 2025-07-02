import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { FolderStats } from '@/types/entities/folder';
import { motion } from 'motion/react';

interface FoldersStatsProps {
	stats: FolderStats;
}

export function FoldersStats({ stats }: FoldersStatsProps) {
	return (
		<>
			<Separator className="my-2" />
			<div className="grid grid-cols-2 gap-3">
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
					<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
						<span className="text-sm font-medium">{stats.directoryCount}</span>
						<Badge variant="secondary" className="text-xs">
							Carpetas
						</Badge>
					</div>
				</motion.div>

				<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
					<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
						<span className="text-sm font-medium">{stats.totalFiles}</span>
						<Badge variant="secondary" className="text-xs">
							Archivos
						</Badge>
					</div>
				</motion.div>
			</div>
		</>
	);
}
