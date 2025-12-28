/**
 * @file Componente de estado vacío del File Browser
 * @module file-browser-new/components/empty-state
 */

import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EmptyStateProps } from '../types';

export function FileBrowserEmptyState({
    title = 'Sin archivos',
    description = 'No se encontraron archivos en esta carpeta.',
    icon: Icon = FolderOpen,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center',
                className
            )}
            data-testid="file-browser-empty-state"
        >
            <div className="rounded-full bg-muted p-4">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
            </div>
            {action && (
                <Button onClick={action.onClick} variant="outline">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
