/**
 * Undo/Redo Panel Component
 *
 * A panel that displays the history of undoable actions with the ability
 * to jump to specific points in history.
 */

import { Clock, Copy, Edit, Move, RotateCcw, RotateCw, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { cn } from '@/lib/utils';
import { toastService } from '@/services/toast/toast.service';
import type { UndoableAction } from '@/services/undo-redo/undo-redo-manager';

export interface UndoRedoPanelProps {
	className?: string;
	maxHeight?: string;
	showTimestamps?: boolean;
	showDetails?: boolean;
	compact?: boolean;
	onClose?: () => void;
}

function getActionIcon(type: string) {
	switch (type) {
		case 'copy':
			return Copy;
		case 'move':
			return Move;
		case 'delete':
			return Trash2;
		case 'rename':
			return Edit;
		default:
			return Clock;
	}
}

function getActionDescription(action: UndoableAction): string {
	const { type, description, originalData } = action;
	if (description) {
		return description;
	}
	const itemCount = Array.isArray(originalData) ? originalData.length : 1;
	const itemText = itemCount === 1 ? 'elemento' : 'elementos';
	switch (type) {
		case 'copy':
			return `Copiar ${itemCount} ${itemText}`;
		case 'move':
			return `Mover ${itemCount} ${itemText}`;
		case 'delete':
			return `Eliminar ${itemCount} ${itemText}`;
		case 'rename':
			return 'Renombrar';
		default:
			return `Acción ${type}`;
	}
}

function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	if (diff < 60_000) {
		return 'Hace un momento';
	}
	if (diff < 3_600_000) {
		return `Hace ${Math.floor(diff / 60_000)} min`;
	}
	if (diff < 86_400_000) {
		return `Hace ${Math.floor(diff / 3_600_000)} h`;
	}
	return date.toLocaleDateString();
}

interface ActionRowProps {
	action: UndoableAction;
	index: number;
	currentIndex: number;
	compact: boolean;
	showDetails: boolean;
	showTimestamps: boolean;
	onJump: (index: number) => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
	action,
	index,
	currentIndex,
	compact,
	showDetails,
	showTimestamps,
	onJump,
}) => {
	const Icon = getActionIcon(action.type);
	const isCurrent = index === currentIndex;
	const isExecuted = index <= currentIndex;
	const canJump = index !== currentIndex;

	const onClick = () => {
		if (canJump) {
			onJump(index);
		}
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
		if ((e.key === 'Enter' || e.key === ' ') && canJump) {
			e.preventDefault();
			onJump(index);
		}
	};

	return (
		<div>
			<button
				className={cn(
					'flex w-full items-center gap-3 rounded-md p-2 transition-all duration-200',
					'cursor-pointer hover:bg-muted/50',
					isCurrent && 'border border-primary/20 bg-primary/10',
					!isExecuted && 'opacity-50',
					compact && 'gap-2 p-1.5'
				)}
				onClick={onClick}
				onKeyDown={onKeyDown}
				type="button"
			>
				<div className={cn('flex min-w-0 flex-1 items-center gap-2', compact && 'gap-1.5')}>
					<Icon className={cn('h-4 w-4 flex-shrink-0', compact && 'h-3 w-3')} />
					<div className="min-w-0 flex-1 text-left">
						<p className={cn('truncate font-medium text-sm', compact && 'text-xs')}>{getActionDescription(action)}</p>
						{showDetails && (action.targetData?.targetPath || action.targetData?.newName) && (
							<p className={cn('truncate text-muted-foreground text-xs', compact && 'text-[10px]')}>
								→ {action.targetData?.targetPath ?? action.targetData?.newName}
							</p>
						)}
					</div>
				</div>
				<div className="flex flex-shrink-0 items-center gap-2">
					{showTimestamps && (
						<span className={cn('text-muted-foreground text-xs', compact && 'text-[10px]')}>
							{formatTimestamp(action.timestamp)}
						</span>
					)}
					{isCurrent && (
						<Badge className={cn('px-1.5 py-0.5 text-xs', compact && 'px-1 text-[10px]')} variant="secondary">
							Actual
						</Badge>
					)}
					{canJump && (
						<div className="flex items-center">
							{index < currentIndex ? (
								<RotateCcw className="h-3 w-3 text-muted-foreground" />
							) : (
								<RotateCw className="h-3 w-3 text-muted-foreground" />
							)}
						</div>
					)}
				</div>
			</button>
		</div>
	);
};

export function UndoRedoPanel({
	className,
	maxHeight = '400px',
	showTimestamps = true,
	showDetails = true,
	compact = false,
	onClose,
}: UndoRedoPanelProps) {
	const { state, undo, redo, clear, getHistory } = useUndoRedo();
	const [isClearing, setIsClearing] = useState(false);

	const history = getHistory();
	const currentIndex = state.currentIndex;

	const handleClear = () => {
		setIsClearing(true);
		try {
			clear();
		} finally {
			setIsClearing(false);
		}
	};

	const handleJumpTo = (targetIndex: number) => {
		const currentIdx = currentIndex;
		if (targetIndex === currentIdx) {
			return;
		}
		try {
			const steps = Math.abs(targetIndex - currentIdx);
			const goBack = targetIndex < currentIdx;
			let chain: Promise<unknown> = Promise.resolve();
			for (let i = 0; i < steps; i++) {
				chain = chain.then(() => (goBack ? undo() : redo()));
			}
			chain.catch(() => {
				toastService.error('No se pudo cambiar el punto del historial');
			});
		} catch (_error) {
			toastService.error('No se pudo cambiar el punto del historial');
		}
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className={cn('pb-3', compact && 'pb-2')}>
				<div className="flex items-center justify-between">
					<CardTitle className={cn('text-base', compact && 'text-sm')}>Historial de Acciones</CardTitle>
					<div className="flex items-center gap-2">
						{history.length > 0 && (
							<Button className="text-xs" disabled={isClearing} onClick={handleClear} size="sm" variant="outline">
								Limpiar
							</Button>
						)}
						{onClose && (
							<Button className="h-6 w-6 p-0" onClick={onClose} size="sm" variant="ghost">
								<X className="h-3 w-3" />
							</Button>
						)}
					</div>
				</div>
				{!compact && (
					<div className="flex items-center gap-4 text-muted-foreground text-xs">
						<span>Total: {history.length}</span>
						<span>Posición: {currentIndex + 1}</span>
					</div>
				)}
			</CardHeader>
			<CardContent className={cn('pt-0', compact && 'p-3 pt-0')}>
				{history.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						<Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
						<p className="text-sm">No hay acciones en el historial</p>
					</div>
				) : (
					<ScrollArea className="h-full" style={{ maxHeight }}>
						<div className="space-y-1">
							{history.map((action, index) => (
								<React.Fragment key={action.id}>
									<ActionRow
										action={action}
										compact={compact}
										currentIndex={currentIndex}
										index={index}
										onJump={handleJumpTo}
										showDetails={showDetails}
										showTimestamps={showTimestamps}
									/>
									{index < history.length - 1 && !compact && <Separator className="my-1" />}
								</React.Fragment>
							))}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}
