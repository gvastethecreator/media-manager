/**
 * @file Componente de estado vacío del File Browser
 * @module file-browser-new/components/empty-state
 */

import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { EmptyStateProps } from '../types';

export function FileBrowserEmptyState({
	title = 'Sin archivos',
	description = 'No se encontraron archivos en esta carpeta.',
	icon: Icon = FolderOpen,
	action,
	className,
}: EmptyStateProps) {
	return (
		<EmptyState
			actions={
				action ? (
					<Button onClick={action.onClick} variant="outline">
						{action.label}
					</Button>
				) : undefined
			}
			className={className}
			description={description}
			icon={Icon}
			title={title}
		/>
	);
}
