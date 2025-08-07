import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils/format.utils';
import type { ExtendedFolder } from './folder-types';

interface ExpandedSubfoldersProps {
	folders: ExtendedFolder[];
}

export function ExpandedSubfolders({ folders }: ExpandedSubfoldersProps) {
	return (
		<motion.div
			animate={{ opacity: 1, height: 'auto' }}
			className="mt-3 space-y-2 border-border border-l-2 pl-4"
			exit={{ opacity: 0, height: 0 }}
			initial={{ opacity: 0, height: 0 }}
			transition={{ duration: 0.2 }}
		>
			{folders.map((child) => (
				<div className="flex items-center justify-between rounded-md bg-muted/30 p-2" key={child.id}>
					<div className="flex items-center gap-2">
						<span className="text-xs">{child.emoji || '📁'}</span>
						<span className="text-muted-foreground text-sm">{child.name}</span>
					</div>
					<div className="flex items-center gap-1">
						{/* Mostrar estadísticas básicas */}
						{(child.totalFiles || 0) > 0 && (
							<Badge className="h-4 px-1 text-[10px]" variant="outline">
								{child.totalFiles} archivos
							</Badge>
						)}
						<Badge className="h-4 px-1 text-[10px]" variant="outline">
							{formatBytes(Number(child.totalSize || 0))}
						</Badge>
					</div>
				</div>
			))}
		</motion.div>
	);
}
