/**
 * @file SelectionCounter component for displaying selection count
 * @module components/features/file-browser/components/selection-counter
 */

import { Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SelectionCounterProps {
	count: number;
	total: number;
	onClear?: () => void;
	className?: string;
	position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
	showClearButton?: boolean;
	showTotal?: boolean;
}

export function SelectionCounter({
	count,
	total,
	onClear,
	position = 'top-right',
	showClearButton = true,
	showTotal = false,
	className,
}: SelectionCounterProps) {
	const positionClasses: Record<NonNullable<SelectionCounterProps['position']>, string> = {
		'top-right': 'top-4 right-4',
		'top-left': 'top-4 left-4',
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4',
	};

	if (count <= 0) {
		return null;
	}

	return (
		<AnimatePresence>
			<motion.output
				animate={{ opacity: 1, scale: 1, y: 0 }}
				aria-label={`${count} elemento${count > 1 ? 's' : ''} seleccionado${count > 1 ? 's' : ''}${showTotal ? ` de ${total}` : ''}`}
				aria-live="polite"
				className={cn(
					'fixed z-50 flex items-center gap-2 rounded-lg border bg-primary px-3 py-2 text-primary-foreground shadow-lg',
					'bg-primary/90 backdrop-blur-sm',
					positionClasses[position],
					className
				)}
				exit={{ opacity: 0, scale: 0.9, y: -8 }}
				initial={{ opacity: 0, scale: 0.9, y: -8 }}
				key="selection-counter"
				transition={{ duration: 0.2, ease: 'easeOut' }}
			>
				{/* Icono de selección */}
				<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20">
					<Check aria-hidden="true" className="h-3 w-3" />
				</div>

				{/* Contador */}
				<span className="font-semibold text-sm">
					{count}
					{showTotal && <span className="ml-1 text-primary-foreground/70">/ {total}</span>}
				</span>

				{/* Texto descriptivo */}
				<span className="text-primary-foreground/80 text-xs">{count === 1 ? 'elemento' : 'elementos'}</span>

				{/* Botón de limpiar selección */}
				{showClearButton && onClear && (
					<button
						aria-label="Limpiar selección"
						className={cn(
							'ml-1 flex h-5 w-5 items-center justify-center',
							'rounded-full transition-colors duration-150',
							'bg-primary-foreground/20 hover:bg-primary-foreground/30',
							'focus:outline-none focus:ring-2 focus:ring-primary-foreground/50'
						)}
						onClick={onClear}
						title="Limpiar selección (Esc)"
						type="button"
					>
						<X aria-hidden="true" className="h-3 w-3" />
					</button>
				)}
			</motion.output>
		</AnimatePresence>
	);
}

/**
 * Componente compacto para mostrar solo el número
 */
export function CompactSelectionCounter({ count, className }: { count: number; className?: string }) {
	if (count === 0) {
		return null;
	}

	return (
		<motion.div
			animate={{ opacity: 1, scale: 1 }}
			aria-label={`${count} seleccionado${count > 1 ? 's' : ''}`}
			className={cn(
				'inline-flex',
				'items-center',
				'justify-center',
				'min-w-6',
				'rounded-md',
				'bg-primary',
				'px-2',
				'py-0.5',
				'font-semibold',
				'text-primary-foreground',
				'text-xs',
				className
			)}
			exit={{ opacity: 0, scale: 0.95 }}
			initial={{ opacity: 0, scale: 0.95 }}
			key="compact-selection-counter"
			transition={{ duration: 0.15, ease: 'easeOut' }}
		>
			{count}
		</motion.div>
	);
}
