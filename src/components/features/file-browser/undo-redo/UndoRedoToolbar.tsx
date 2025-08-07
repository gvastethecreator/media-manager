/**
 * Undo/Redo Toolbar Component
 *
 * A toolbar component that includes undo/redo buttons along with
 * other file operation controls.
 */

import { ChevronDown, History } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useUndoRedoState } from '@/hooks/use-undo-redo';
import { cn } from '@/lib/utils';
import { RedoButton, UndoButton } from './UndoRedoButton';
import { UndoRedoPanel } from './UndoRedoPanel';

export interface UndoRedoToolbarProps {
	/** Toolbar className */
	className?: string;
	/** Show history panel button */
	showHistoryButton?: boolean;
	/** Show separator after undo/redo buttons */
	showSeparator?: boolean;
	/** Button variant */
	buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
	/** Button size */
	buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
	/** Compact mode */
	compact?: boolean;
	/** Additional toolbar content */
	children?: React.ReactNode;
}

/**
 * Undo/Redo toolbar component
 */
export function UndoRedoToolbar({
	className,
	showHistoryButton = true,
	showSeparator = true,
	buttonVariant = 'ghost',
	buttonSize = 'icon',
	compact = false,
	children,
}: UndoRedoToolbarProps) {
	const { state } = useUndoRedoState();
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);

	const hasHistory = state.totalActions > 0;

	return (
		<div className={cn('flex items-center gap-1', compact && 'gap-0.5', className)}>
			{/* Undo Button */}
			<UndoButton className={compact ? 'h-7 w-7' : undefined} size={buttonSize} variant={buttonVariant} />

			{/* Redo Button */}
			<RedoButton className={compact ? 'h-7 w-7' : undefined} size={buttonSize} variant={buttonVariant} />

			{/* History Button */}
			{showHistoryButton && (
				<Popover onOpenChange={setIsHistoryOpen} open={isHistoryOpen}>
					<PopoverTrigger asChild>
						<Button
							aria-label="Ver historial de acciones"
							className={cn('relative', compact && 'h-7 w-7', !hasHistory && 'opacity-50')}
							disabled={!hasHistory}
							size={buttonSize}
							variant={buttonVariant}
						>
							<History className="h-4 w-4" />
							{hasHistory && <ChevronDown className="-bottom-0.5 -right-0.5 absolute h-2 w-2" />}
						</Button>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-80 p-0" side="bottom">
						<UndoRedoPanel compact={compact} maxHeight="300px" onClose={() => setIsHistoryOpen(false)} />
					</PopoverContent>
				</Popover>
			)}

			{/* Separator */}
			{showSeparator && children && <Separator className="mx-1 h-6" orientation="vertical" />}

			{/* Additional content */}
			{children}
		</div>
	);
}

/**
 * Simple undo/redo button group
 */
export function UndoRedoButtonGroup({
	className,
	buttonVariant = 'ghost',
	buttonSize = 'icon',
	compact = false,
}: Pick<UndoRedoToolbarProps, 'className' | 'buttonVariant' | 'buttonSize' | 'compact'>) {
	return (
		<div className={cn('flex items-center gap-1', compact && 'gap-0.5', className)}>
			<UndoButton className={compact ? 'h-7 w-7' : undefined} size={buttonSize} variant={buttonVariant} />
			<RedoButton className={compact ? 'h-7 w-7' : undefined} size={buttonSize} variant={buttonVariant} />
		</div>
	);
}

/**
 * Undo/Redo status indicator
 */
export function UndoRedoStatus({ className }: { className?: string }) {
	const { state } = useUndoRedoState();

	if (state.totalActions === 0) {
		return null;
	}

	return (
		<div className={cn('flex items-center gap-2 text-muted-foreground text-xs', className)}>
			<span>
				{state.currentIndex + 1} / {state.totalActions}
			</span>
			{state.canUndo && <span className="text-primary">Deshacer disponible</span>}
			{state.canRedo && <span className="text-primary">Rehacer disponible</span>}
		</div>
	);
}
