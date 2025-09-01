import { AlertCircle } from 'lucide-react';
import { motion } from '@/components/ui/motion-shim';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ExtendedFolder } from './folder-types';

interface FolderErrorDisplayProps {
	folder: ExtendedFolder;
}

export function FolderErrorDisplay({ folder }: FolderErrorDisplayProps) {
	if (!folder.error) {
		return null;
	}

	return (
		<motion.div
			animate={{ opacity: 1, height: 'auto' }}
			className="mt-1"
			exit={{ opacity: 0, height: 0 }}
			initial={{ opacity: 0, height: 0 }}
		>
			<Alert className="p-2" variant="destructive">
				<AlertCircle className="mr-1 h-3.5 w-3.5" />
				<AlertTitle className="text-xs">Error en carpeta</AlertTitle>
				<AlertDescription className="mt-1 text-xs">{folder.error}</AlertDescription>
			</Alert>
		</motion.div>
	);
}
