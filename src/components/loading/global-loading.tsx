/**
 * @file Loading Global
 * @description Estados de carga globales con indicadores de progreso
 */

import { Database, Folder, ImageIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlobalLoadingProps {
	/** Mensaje de carga */
	message?: string;
	/** Submensaje opcional */
	subMessage?: string;
	/** Progreso (0-100) */
	progress?: number;
	/** Tamaño del spinner */
	size?: 'sm' | 'md' | 'lg';
	/** Mostrar overlay completo */
	overlay?: boolean;
	/** Clases adicionales */
	className?: string;
}

const sizeClasses = {
	sm: 'h-6 w-6',
	md: 'h-10 w-10',
	lg: 'h-16 w-16',
};

const textSizes = {
	sm: 'text-sm',
	md: 'text-base',
	lg: 'text-lg',
};

/**
 * Loading Spinner Global
 */
export function GlobalLoading({
	message = 'Cargando...',
	subMessage,
	progress,
	size = 'md',
	overlay = true,
	className,
}: GlobalLoadingProps) {
	return (
		<output
			aria-busy="true"
			aria-live="polite"
			className={cn(
				'flex flex-col items-center justify-center gap-4',
				overlay && 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
				className
			)}
		>
			<div className="relative">
				<Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
				{progress !== undefined && (
					<svg
						aria-hidden="true"
						className={cn('absolute inset-0 -rotate-90', sizeClasses[size])}
						viewBox="0 0 100 100"
					>
						<circle
							className="text-primary/20"
							cx="50"
							cy="50"
							fill="none"
							r="45"
							stroke="currentColor"
							strokeWidth="6"
						/>
						<circle
							className="text-primary transition-all duration-300"
							cx="50"
							cy="50"
							fill="none"
							r="45"
							stroke="currentColor"
							strokeDasharray={`${progress * 2.83} 283`}
							strokeLinecap="round"
							strokeWidth="6"
						/>
					</svg>
				)}
			</div>

			<div className="text-center">
				<p className={cn('font-medium text-foreground', textSizes[size])}>{message}</p>
				{subMessage && <p className="mt-1 text-muted-foreground text-sm">{subMessage}</p>}
				{progress !== undefined && (
					<p className="mt-1 font-mono text-muted-foreground text-sm">{Math.round(progress)}%</p>
				)}
			</div>

			<span className="sr-only">{message}</span>
		</output>
	);
}

/**
 * Loading Card para estados de carga en cards
 */
export function LoadingCard({ className }: { className?: string }) {
	return (
		<div className={cn('rounded-lg border border-border bg-card p-4', className)}>
			<div className="flex items-start gap-4">
				<div className="h-16 w-16 animate-skeleton rounded-md bg-muted" />
				<div className="flex-1 space-y-3">
					<div className="h-4 w-3/4 animate-skeleton rounded bg-muted" />
					<div className="h-3 w-1/2 animate-skeleton rounded bg-muted" />
					<div className="h-3 w-2/3 animate-skeleton rounded bg-muted" />
				</div>
			</div>
		</div>
	);
}

/**
 * Loading Grid para múltiples items
 */
export function LoadingGrid({ count = 6, className }: { count?: number; className?: string }) {
	return (
		<div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
			{Array.from({ length: count }).map((_, i) => (
				<LoadingCard key={i} />
			))}
		</div>
	);
}

/**
 * Page Loading para transiciones de página
 */
export function PageLoading({ className }: { className?: string }) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 90) return prev;
				return prev + Math.random() * 15;
			});
		}, 200);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className={cn('flex min-h-[50vh] flex-col items-center justify-center gap-6', className)}>
			<div className="relative">
				<div className="flex gap-2">
					<div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-lg bg-primary/10">
						<ImageIcon className="h-6 w-6 text-primary" />
					</div>
					<div
						className="flex h-12 w-12 animate-pulse items-center justify-center rounded-lg bg-primary/10"
						style={{ animationDelay: '200ms' }}
					>
						<Folder className="h-6 w-6 text-primary" />
					</div>
					<div
						className="flex h-12 w-12 animate-pulse items-center justify-center rounded-lg bg-primary/10"
						style={{ animationDelay: '400ms' }}
					>
						<Database className="h-6 w-6 text-primary" />
					</div>
				</div>
			</div>

			<div className="w-64 space-y-2">
				<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
					<div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
				</div>
				<p className="text-center text-muted-foreground text-sm">Cargando contenido...</p>
			</div>
		</div>
	);
}

export default GlobalLoading;
