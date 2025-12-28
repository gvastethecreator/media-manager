/**
 * @file Componente de estado de carga del File Browser
 * @module file-browser-new/components/loading-state
 */

import { cn } from '@/lib/utils';
import type { LoadingStateProps, ViewMode } from '../types';

interface SkeletonItemProps {
    size: number;
    className?: string;
}

function SkeletonItem({ size, className }: SkeletonItemProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-lg bg-muted',
                className
            )}
            style={{ width: size, height: size }}
        />
    );
}

function SkeletonRow({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center gap-3 animate-pulse', className)}>
            <div className="h-8 w-8 rounded bg-muted" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
        </div>
    );
}

const SKELETON_COUNTS: Record<ViewMode, number> = {
    grid: 24,
    list: 15,
    masonry: 20,
    table: 12,
    cards: 12,
};

export function FileBrowserLoadingState({
    viewMode,
    itemSize = 150,
    itemCount,
    className,
}: LoadingStateProps) {
    const count = itemCount ?? SKELETON_COUNTS[viewMode];

    // Vista de lista o tabla
    if (viewMode === 'list' || viewMode === 'table') {
        return (
            <div
                className={cn('flex flex-col gap-1 p-4', className)}
                data-testid="file-browser-loading-state"
            >
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonRow key={i} />
                ))}
            </div>
        );
    }

    // Vista de grid/masonry/cards
    return (
        <div
            className={cn(
                'grid gap-2 p-4',
                className
            )}
            data-testid="file-browser-loading-state"
            style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
            }}
        >
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonItem key={i} size={itemSize} />
            ))}
        </div>
    );
}
