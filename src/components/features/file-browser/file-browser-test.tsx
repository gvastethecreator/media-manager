'use client';

import type { FileItem } from '@/types/file-item';
import { useState } from 'react';
import { FileBrowser } from './file-browser';
import { FileBrowser2 } from './file-browser-2';

interface FileBrowserTestProps {
	items: FileItem[];
}

/**
 * Componente para probar y comparar FileBrowser vs FileBrowser2
 */
export function FileBrowserTest({ items }: FileBrowserTestProps) {
	const [activeVersion, setActiveVersion] = useState<'v1' | 'v2'>('v2');

	return (
		<div className="h-full w-full flex flex-col">
			{/* Selector de versión */}
			<div className="flex items-center gap-2 p-2 border-b bg-muted/50">
				<span className="text-sm font-medium">Versión FileBrowser:</span>
				<div className="flex gap-1">
					<button
						onClick={() => setActiveVersion('v1')}
						className={`px-3 py-1 text-xs rounded border ${
							activeVersion === 'v1'
								? 'bg-blue-500 text-white border-blue-500'
								: 'bg-background hover:bg-muted border-border'
						}`}
					>
						V1 (Original)
					</button>
					<button
						onClick={() => setActiveVersion('v2')}
						className={`px-3 py-1 text-xs rounded border ${
							activeVersion === 'v2'
								? 'bg-green-500 text-white border-green-500'
								: 'bg-background hover:bg-muted border-border'
						}`}
					>
						V2 (Minimalista)
					</button>
				</div>
				<div className="ml-auto text-xs text-muted-foreground">Items: {items.length}</div>
			</div>

			{/* Contenedor del FileBrowser activo */}
			<div className="flex-1 relative">
				{activeVersion === 'v1' && (
					<div className="absolute inset-0">
						<FileBrowser
							items={items}
							onItemClick={(item) => console.log('V1 Click:', item.name)}
							onItemDoubleClick={(item) => console.log('V1 Double Click:', item.name)}
						/>
					</div>
				)}
				{activeVersion === 'v2' && (
					<div className="absolute inset-0">
						<FileBrowser2
							items={items}
							onItemClick={(item) => console.log('V2 Click:', item.name)}
							onItemDoubleClick={(item) => console.log('V2 Double Click:', item.name)}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
