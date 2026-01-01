import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/* =====================================================
 * 🔄 LOADING SPINNER v2.0
 * Spinner con variantes, estados y feedback visual mejorado
 * ===================================================== */

const spinnerVariants = cva('inline-flex items-center justify-center transition-all duration-dt-normal ease-dt-out', {
	variants: {
		size: {
			xs: 'h-3 w-3',
			sm: 'h-4 w-4',
			md: 'h-6 w-6',
			lg: 'h-8 w-8',
			xl: 'h-12 w-12',
		},
		variant: {
			default: 'text-muted-foreground',
			primary: 'text-primary',
			success: 'text-dt-success-500',
			warning: 'text-dt-warning-500',
			danger: 'text-dt-danger-500',
		},
	},
	defaultVariants: {
		size: 'md',
		variant: 'default',
	},
});

export interface LoadingSpinnerProps
	extends React.HTMLAttributes<HTMLOutputElement>,
	VariantProps<typeof spinnerVariants> {
	/** Estado actual: loading, success, error */
	state?: 'loading' | 'success' | 'error';
	/** Texto descriptivo para accesibilidad */
	label?: string;
	/** Mostrar texto junto al spinner */
	showLabel?: boolean;
}

export function LoadingSpinner({
	size,
	variant,
	state = 'loading',
	label = 'Cargando...',
	showLabel = false,
	className,
	...props
}: LoadingSpinnerProps) {
	const sizeMap = { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 };
	const iconSize = sizeMap[size || 'md'];

	return (
		<output aria-live="polite" className={cn('inline-flex items-center gap-2', className)} {...props}>
			<span className={cn(spinnerVariants({ size, variant }))}>
				{state === 'loading' && <Loader2 className="animate-spin-smooth" size={iconSize} />}
				{state === 'success' && <CheckCircle className="animate-scale-in text-dt-success-500" size={iconSize} />}
				{state === 'error' && <XCircle className="animate-shake text-dt-danger-500" size={iconSize} />}
			</span>
			{showLabel && <span className="animate-fade-in text-muted-foreground text-sm">{label}</span>}
			<span className="sr-only">{label}</span>
		</output>
	);
}

/* =====================================================
 * 🔵 LOADING DOTS
 * Indicador de carga con puntos animados
 * ===================================================== */
export interface LoadingDotsProps extends React.HTMLAttributes<HTMLOutputElement> {
	size?: 'sm' | 'md' | 'lg';
}

export function LoadingDots({ size = 'md', className, ...props }: LoadingDotsProps) {
	const sizeClasses = {
		sm: 'gap-1 [&>span]:h-1 [&>span]:w-1',
		md: 'gap-1.5 [&>span]:h-1.5 [&>span]:w-1.5',
		lg: 'gap-2 [&>span]:h-2 [&>span]:w-2',
	};

	return (
		<output aria-label="Cargando" className={cn('loading-dots', sizeClasses[size], className)} {...props}>
			<span />
			<span />
			<span />
		</output>
	);
}

/* =====================================================
 * 📊 PROGRESS LOADER
 * Indicador de progreso con porcentaje
 * ===================================================== */

export interface ProgressLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Progreso actual (0-100) */
	progress: number;
	/** Mostrar porcentaje */
	showPercentage?: boolean;
	/** Texto de estado */
	status?: string;
	/** Variante de color */
	variant?: 'default' | 'primary' | 'success';
	/** Tamaño */
	size?: 'sm' | 'md' | 'lg';
}

export function ProgressLoader({
	progress,
	showPercentage = true,
	status,
	variant = 'primary',
	size = 'md',
	className,
	...props
}: ProgressLoaderProps) {
	const clampedProgress = Math.min(100, Math.max(0, progress));

	const heightClasses = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
	const variantClasses = {
		default: 'bg-muted-foreground',
		primary: 'bg-gradient-to-r from-primary to-primary/80',
		success: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
	};

	return (
		<div className={cn('w-full space-y-2', className)} {...props}>
			{(showPercentage || status) && (
				<div className="flex items-center justify-between text-sm">
					{status && <span className="animate-fade-in truncate text-muted-foreground">{status}</span>}
					{showPercentage && (
						<span className="font-medium text-foreground tabular-nums">{Math.round(clampedProgress)}%</span>
					)}
				</div>
			)}
			<div
				aria-valuemax={100}
				aria-valuemin={0}
				aria-valuenow={clampedProgress}
				className={cn('w-full overflow-hidden rounded-full bg-muted', heightClasses[size])}
				role="progressbar"
			>
				<div
					className={cn('h-full rounded-full transition-all duration-dt-normal ease-dt-out', variantClasses[variant])}
					style={{ width: `${clampedProgress}%` }}
				/>
			</div>
		</div>
	);
}

/* =====================================================
 * 🌊 SKELETON LOADER
 * Placeholder animado para contenido en carga
 * ===================================================== */

export interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Variante de animación */
	animation?: 'pulse' | 'shimmer';
	/** Forma */
	shape?: 'rectangle' | 'circle' | 'text';
	/** Líneas de texto */
	lines?: number;
}

export function SkeletonLoader({
	animation = 'shimmer',
	shape = 'rectangle',
	lines = 1,
	className,
	...props
}: SkeletonLoaderProps) {
	const baseClass = animation === 'shimmer' ? 'animate-skeleton-shimmer' : 'animate-skeleton';

	const shapeClasses = {
		rectangle: 'rounded-md',
		circle: 'rounded-full aspect-square',
		text: 'rounded h-4',
	};

	if (shape === 'text' && lines > 1) {
		return (
			<div className={cn('space-y-2', className)} {...props}>
				{Array.from({ length: lines }).map((_, i) => (
					<div className={cn(baseClass, shapeClasses.text, i === lines - 1 ? 'w-3/4' : 'w-full')} key={i} />
				))}
			</div>
		);
	}

	return <div className={cn(baseClass, shapeClasses[shape], className)} {...props} />;
}
