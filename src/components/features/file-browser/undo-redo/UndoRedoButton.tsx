/**
 * Undo/Redo Button Component
 *
 * A button component for undo/redo operations with visual feedback
 * and keyboard shortcut display.
 */

import { Redo2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUndoRedoState } from '@/hooks/use-undo-redo';
import { cn } from '@/lib/utils';
import { undoRedoManager } from '@/services/undo-redo/undo-redo-manager';

export interface UndoRedoButtonProps {
	/** Button type */
	type: 'undo' | 'redo';
	/** Button variant (admite alias 'default' y 'link') */
	variant?: 'primary' | 'outline' | 'ghost' | 'secondary' | 'default' | 'link';
	/** Button size (admite alias 'default' que mapea a 'md') */
	size?: 'md' | 'sm' | 'lg' | 'icon' | 'default';
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

		if (isDisabled) {
			return;
		}

		try {
			if (isUndo) {
				await undoRedoManager.undo();
			} else {
				await undoRedoManager.redo();
			}
		} catch (_error) {
			// Silenciar logs en UI; el manager ya registra los errores
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

	// Normalización de alias para compatibilidad con <Button />
	const normalizedSize: 'md' | 'sm' | 'lg' | 'icon' = size === 'default' ? 'md' : size;
	const normalizedVariant: 'primary' | 'outline' | 'ghost' | 'secondary' | 'link' =
		variant === 'default' ? 'primary' : (variant as any);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						aria-label={getTooltipContent()}
						className={cn('transition-all duration-200', isDisabled && 'cursor-not-allowed opacity-50', className)}
						disabled={isDisabled}
						onClick={handleClick}
						size={normalizedSize}
						variant={normalizedVariant}
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
