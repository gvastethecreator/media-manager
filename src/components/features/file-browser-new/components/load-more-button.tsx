/**
 * @file Botón de cargar más para File Browser
 * @module file-browser-new/components/load-more-button
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LoadMoreButtonProps {
    /** Si hay más items */
    hasMore: boolean;
    /** Si está cargando */
    isLoading: boolean;
    /** Items cargados */
    loadedCount: number;
    /** Total de items */
    totalCount: number;
    /** Handler de carga */
    onLoadMore: () => void;
    /** Clase CSS adicional */
    className?: string;
}

export function LoadMoreButton({
    hasMore,
    isLoading,
    loadedCount,
    totalCount,
    onLoadMore,
    className,
}: LoadMoreButtonProps) {
    if (!hasMore && !isLoading) return null;

    const remaining = totalCount - loadedCount;

    return (
        <div
            className={cn(
                'flex items-center justify-center gap-3 py-3 border-t bg-muted/30',
                className
            )}
            data-testid="load-more-button"
        >
            <Button
                disabled={isLoading || !hasMore}
                onClick={onLoadMore}
                size="sm"
                variant="outline"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando...
                    </>
                ) : (
                    <>
                        Cargar más
                        {remaining > 0 && (
                            <span className="ml-1 text-muted-foreground">
                                ({remaining.toLocaleString()} restantes)
                            </span>
                        )}
                    </>
                )}
            </Button>
            <span className="text-xs text-muted-foreground">
                {loadedCount.toLocaleString()} de {totalCount.toLocaleString()}
            </span>
        </div>
    );
}
