/**
 * @file Componente de estado vacío del File Browser
 * @module file-browser-new/components/empty-state
 */

import type { LucideIcon } from 'lucide-react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { EmptyStateProps } from '../types/props.types';

export function FileBrowserEmptyState({
	title = 'No files',
	description = 'No files were found in this folder.',
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
			icon={Icon as LucideIcon}
			title={title}
		/>
	);
}
