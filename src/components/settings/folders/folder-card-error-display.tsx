import { AlertCircle } from 'lucide-react';
import { memo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ExtendedFolder } from './folder-types';

interface FolderErrorDisplayProps {
	folder: ExtendedFolder;
}

export const FolderErrorDisplay = memo(function FolderErrorDisplay({ folder }: FolderErrorDisplayProps) {
	if (!folder.error) {
		return null;
	}

	return (
		<div className="mt-1">
			<Alert className="p-2" variant="destructive">
				<AlertCircle className="mr-1 h-3.5 w-3.5" />
				<AlertTitle className="text-xs">Error en carpeta</AlertTitle>
				<AlertDescription className="mt-1 text-xs">{folder.error}</AlertDescription>
			</Alert>
		</div>
	);
});
