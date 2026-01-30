import { cn } from '@/lib/utils';

/* =====================================================
 * 💀 SKELETON v2.0
 * Placeholder animado con variantes mejoradas
 * ===================================================== */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Tipo de animación */
	animation?: 'pulse' | 'shimmer' | 'none';
}

function Skeleton({ className, animation = 'shimmer', ...props }: SkeletonProps) {
	const animationClasses = {
		pulse: 'animate-skeleton',
		shimmer:
			'animate-skeleton-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]',
		none: '',
	};

	return (
		<div
			className={cn(
				'rounded-dt-sm',
				animation === 'shimmer' ? animationClasses.shimmer : `bg-muted ${animationClasses[animation]}`,
				className
			)}
			{...props}
		/>
	);
}

/* =====================================================
 * 📝 SKELETON TEXT
 * Placeholder para bloques de texto
 * ===================================================== */

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Número de líneas */
	lines?: number;
	/** Última línea más corta */
	lastLineShort?: boolean;
}

function SkeletonText({ lines = 3, lastLineShort = true, className, ...props }: SkeletonTextProps) {
	return (
		<div className={cn('space-y-2', className)} {...props}>
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton className={cn('h-4', lastLineShort && i === lines - 1 ? 'w-3/4' : 'w-full')} key={i} />
			))}
		</div>
	);
}

/* =====================================================
 * 🖼️ SKELETON CARD
 * Placeholder para tarjetas de contenido
 * ===================================================== */

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn('space-y-4 rounded-lg border-2 border-border/50 p-4', className)} {...props}>
			{/* Imagen */}
			<Skeleton className="h-32 w-full rounded-md" />
			{/* Título */}
			<Skeleton className="h-5 w-3/4" />
			{/* Descripción */}
			<div className="space-y-2">
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-5/6" />
			</div>
			{/* Footer */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-8 rounded-full" />
				<Skeleton className="h-4 w-24" />
			</div>
		</div>
	);
}

/* =====================================================
 * 📋 SKELETON LIST
 * Placeholder para listas de items
 * ===================================================== */

export interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Número de items */
	count?: number;
	/** Mostrar avatar */
	showAvatar?: boolean;
}

function SkeletonList({ count = 5, showAvatar = true, className, ...props }: SkeletonListProps) {
	return (
		<div className={cn('space-y-3', className)} {...props}>
			{Array.from({ length: count }).map((_, i) => (
				<div className="flex items-center gap-3" key={i}>
					{showAvatar && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/2" />
					</div>
				</div>
			))}
		</div>
	);
}

/* =====================================================
 * 🎴 SKELETON GRID
 * Placeholder para grids de imágenes/cards
 * ===================================================== */

export interface SkeletonGridProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Número de items */
	count?: number;
	/** Columnas */
	columns?: 2 | 3 | 4 | 5 | 6;
}

function SkeletonGrid({ count = 6, columns = 3, className, ...props }: SkeletonGridProps) {
	const colClasses = {
		2: 'grid-cols-2',
		3: 'grid-cols-3',
		4: 'grid-cols-4',
		5: 'grid-cols-5',
		6: 'grid-cols-6',
	};

	return (
		<div className={cn('grid gap-4', colClasses[columns], className)} {...props}>
			{Array.from({ length: count }).map((_, i) => (
				<Skeleton className="aspect-square rounded-lg" key={i} />
			))}
		</div>
	);
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonList, SkeletonGrid };
