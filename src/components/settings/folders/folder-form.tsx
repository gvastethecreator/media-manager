'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface FolderFormProps {
	isProcessing: boolean;
	isLoading: boolean;
	onAddFolder: (path: string) => Promise<void>;
}

export function FolderForm({ isProcessing, isLoading, onAddFolder }: FolderFormProps) {
	const [folderPath, setFolderPath] = useState('');

	const handleSubmit = async () => {
		if (!folderPath.trim()) {
			return;
		}
		await onAddFolder(folderPath);
		setFolderPath('');
	};

	return (
		<div className="flex items-center gap-2 p-0 border-none">
			<div className="flex-1">
				<Input
					type="text"
					placeholder="Ruta de la carpeta (ej: C:\Users\Usuario\Imágenes)"
					value={folderPath}
					onChange={(e) => setFolderPath(e.target.value)}
					className="h-7 text-xs"
					disabled={isProcessing}
				/>
			</div>
			<Button
				size="sm"
				className="h-7 text-xs"
				onClick={handleSubmit}
				disabled={isLoading || isProcessing || !folderPath.trim()}
			>
				{isProcessing ? (
					<>
						<RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
						<span>Procesando...</span>
					</>
				) : (
					<>
						<FolderPlus className="h-3.5 w-3.5 mr-1.5" />
						<span>Agregar</span>
					</>
				)}
			</Button>
		</div>
	);
}
