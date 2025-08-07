/**
 * Undo/Redo Button Component
 *
 * A button component for undo/redo operations with visual feedback
 * and keyboard shortcut display.
 */

import { Redo2, Undo2 } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUndoRedoState } from '@/hooks/use-undo-redo';
import { cn } from '@/lib/utils';
import { undoRedoManager } from '@/services/undo-redo/undo-redo-manager';

export interface UndoRedoButtonProps {
	/** Button type */
	type: 'undo' | 'redo';
	/** Button variant */
	variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
	/** Button size */
	size?: 'md' | 'sm' | 'lg' | 'icon';
	/** Additional CSS classes */
	className?: string;
	/** Show keyboard shortcut in tooltip */
	showShortcut?: boolean;
	/** Custom onClick handler (overrides default behavior) */
	onClick?: () => void;
	/** Disabled state */
	disabled?: boolean;
}

/**
 * Undo/Redo button component
 */
export function UndoRedoButton({
	type,
	variant = 'ghost',
	size = 'icon',
	className,
	showShortcut = true,
	onClick,
	disabled,
}: UndoRedoButtonProps) {
	const { canUndo, canRedo } = useUndoRedoState();

	const isUndo = type === 'undo';
	const canPerformAction = isUndo ? canUndo : canRedo;
	const isDisabled = disabled || !canPerformAction;

	const handleClick = async () => {
		if (onClick) {
			onClick();
			return;
		}

		if (isDisabled) return;

		try {
			if (isUndo) {
				await undoRedoManager.undo();
			} else {
				await undoRedoManager.redo();
			}
		} catch (error) {
			console.error(`Failed to ${type}:`, error);
		}
	};

	const getTooltipContent = () => {
		const action = isUndo ? 'Deshacer' : 'Rehacer';
		const shortcut = isUndo ? 'Ctrl+Z' : 'Ctrl+Shift+Z';

		if (!canPerformAction) {
			return `No hay acciones para ${action.toLowerCase()}`;
		}

		return showShortcut ? `${action} (${shortcut})` : action;
	};

	const Icon = isUndo ? Undo2 : Redo2;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						aria-label={getTooltipContent()}
						className={cn('transition-all duration-200', isDisabled && 'cursor-not-allowed opacity-50', className)}
						disabled={isDisabled}
						onClick={handleClick}
						size={size}
						variant={variant}
					>
						<Icon className="h-4 w-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{getTooltipContent()}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * Undo button component
 */
export function UndoButton(props: Omit<UndoRedoButtonProps, 'type'>) {
	return <UndoRedoButton {...props} type="undo" />;
}

/**
 * Redo button component
 */
export function RedoButton(props: Omit<UndoRedoButtonProps, 'type'>) {
	return <UndoRedoButton {...props} type="redo" />;
}
