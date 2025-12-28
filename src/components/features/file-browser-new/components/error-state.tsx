/**
 * @file Componente de error del File Browser
 * @module file-browser-new/components/error-state
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
    /** Título del error */
    title?: string;
    /** Mensaje de error */
    message?: string;
    /** Handler de reintento */
    onRetry?: () => void;
    /** Clase CSS adicional */
    className?: string;
}

export function FileBrowserErrorState({
    title = 'Error al cargar',
    message = 'No se pudieron cargar los archivos. Por favor, intenta de nuevo.',
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                'flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center',
                className
            )}
            data-testid="file-browser-error-state"
        >
            <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
            </div>
            {onRetry && (
                <Button onClick={onRetry} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reintentar
                </Button>
            )}
        </div>
    );
}
