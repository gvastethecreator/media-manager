import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, Loader2, type LucideIcon, XCircle } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/* =====================================================
 * 📢 FEEDBACK SYSTEM v2.0
 * Sistema unificado de feedback visual para acciones del usuario
 * ===================================================== */

/* =====================================================
 * 🎯 INLINE FEEDBACK
 * Feedback contextual dentro del flujo de la UI
 * ===================================================== */

const inlineFeedbackVariants = cva(
	'inline-flex animate-fade-in items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-dt-normal',
	{
		variants: {
			variant: {
				info: 'bg-ui-info text-ui-info-text',
				success: 'bg-ui-success text-ui-success-text',
				warning: 'bg-ui-warning text-ui-warning-text',
				error: 'bg-ui-error text-ui-error-text',
				loading: 'bg-muted text-muted-foreground',
			},
			size: {
				sm: 'px-2 py-1 text-xs',
				md: 'px-3 py-2 text-sm',
				lg: 'px-4 py-3 text-base',
			},
		},
		defaultVariants: {
			variant: 'info',
			size: 'md',
		},
	}
);

export interface InlineFeedbackProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof inlineFeedbackVariants> {
	/** Icono personalizado */
	icon?: LucideIcon;
	/** Mostrar icono */
	showIcon?: boolean;
}

const variantIcons: Record<string, LucideIcon> = {
	info: Info,
	success: CheckCircle2,
	warning: AlertCircle,
	error: XCircle,
	loading: Loader2,
};

export function InlineFeedback({
	variant = 'info',
	size,
	icon,
	showIcon = true,
	className,
	children,
	...props
}: InlineFeedbackProps) {
	const Icon = icon || variantIcons[variant || 'info'];
	const isLoading = variant === 'loading';

	return (
		<div className={cn(inlineFeedbackVariants({ variant, size }), className)} {...props}>
			{showIcon && (
				<Icon className={cn('shrink-0', isLoading && 'animate-spin', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
			)}
			<span>{children}</span>
		</div>
	);
}

/* =====================================================
 * 🏷️ STATUS BADGE
 * Badge para indicar estado de un elemento
 * ===================================================== */

const statusBadgeVariants = cva(
	'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-dt-fast',
	{
		variants: {
			status: {
				idle: 'bg-muted text-muted-foreground',
				pending: 'bg-ui-warning text-ui-warning-text',
				processing: 'bg-ui-info text-ui-info-text',
				success: 'bg-ui-success text-ui-success-text',
				error: 'bg-ui-error text-ui-error-text',
			},
			size: {
				sm: 'px-2 py-0.5 text-xs',
				md: 'px-2.5 py-1 text-xs',
				lg: 'px-3 py-1.5 text-sm',
			},
		},
		defaultVariants: {
			status: 'idle',
			size: 'md',
		},
	}
);

export interface StatusBadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof statusBadgeVariants> {
	/** Mostrar indicador animado */
	animated?: boolean;
}

export function StatusBadge({
	status = 'idle',
	size,
	animated = false,
	className,
	children,
	...props
}: StatusBadgeProps) {
	const showPulse = animated && (status === 'processing' || status === 'pending');

	return (
		<span className={cn(statusBadgeVariants({ status, size }), className)} {...props}>
			{showPulse && (
				<span className="relative flex h-2 w-2">
					<span
						className={cn(
							'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
							status === 'processing' && 'bg-ui-info-text',
							status === 'pending' && 'bg-ui-warning-text'
						)}
					/>
					<span
						className={cn(
							'relative inline-flex h-2 w-2 rounded-full',
							status === 'processing' && 'bg-ui-info-text',
							status === 'pending' && 'bg-ui-warning-text'
						)}
					/>
				</span>
			)}
			{children}
		</span>
	);
}

/* =====================================================
 * 🔔 ACTION FEEDBACK
 * Feedback temporal tras una acción del usuario
 * ===================================================== */

export interface ActionFeedbackProps {
	/** Clase adicional */
	className?: string;
	/** Mensaje para cada estado */
	messages?: {
		loading?: string;
		success?: string;
		error?: string;
	};
	/** Callback cuando vuelve a idle */
	onReset?: () => void;
	/** Duración del estado success/error antes de volver a idle (ms) */
	resetDelay?: number;
	/** Estado actual */
	state: 'idle' | 'loading' | 'success' | 'error';
}

export function ActionFeedback({ state, messages = {}, resetDelay = 2000, onReset, className }: ActionFeedbackProps) {
	const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	React.useEffect(() => {
		if (state === 'success' || state === 'error') {
			timerRef.current = setTimeout(() => {
				onReset?.();
			}, resetDelay);
		}
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [state, resetDelay, onReset]);

	if (state === 'idle') return null;

	const variants = {
		loading: { icon: Loader2, text: messages.loading || 'Procesando...', class: 'loading' },
		success: { icon: CheckCircle2, text: messages.success || '¡Listo!', class: 'success' },
		error: { icon: XCircle, text: messages.error || 'Error', class: 'error' },
	};

	const current = variants[state];
	const Icon = current.icon;

	return (
		<InlineFeedback
			className={cn('animate-slide-up', className)}
			variant={current.class as 'loading' | 'success' | 'error'}
		>
			{current.text}
		</InlineFeedback>
	);
}

/* =====================================================
 * 📊 OPERATION PROGRESS
 * Indicador de progreso para operaciones múltiples
 * ===================================================== */

export interface OperationProgressProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Items completados */
	completed: number;
	/** Items con error */
	failed?: number;
	/** Texto de operación */
	operation?: string;
	/** Mostrar detalles */
	showDetails?: boolean;
	/** Total de items */
	total: number;
}

export function OperationProgress({
	total,
	completed,
	failed = 0,
	operation = 'Procesando',
	showDetails = true,
	className,
	...props
}: OperationProgressProps) {
	const progress = total > 0 ? (completed / total) * 100 : 0;
	const isComplete = completed >= total;
	const hasErrors = failed > 0;

	return (
		<div
			className={cn('w-full animate-fade-in space-y-2 rounded-lg border-2 border-border/50 bg-muted/30 p-4', className)}
			{...props}
		>
			<div className="flex items-center justify-between text-sm">
				<div className="flex items-center gap-2">
					{!isComplete && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
					{isComplete && !hasErrors && <CheckCircle2 className="h-4 w-4 text-success" />}
					{isComplete && hasErrors && <AlertCircle className="h-4 w-4 text-warning" />}
					<span className="font-medium">{operation}</span>
				</div>
				{showDetails && (
					<span className="text-muted-foreground tabular-nums">
						{completed}/{total}
						{hasErrors && <span className="ml-2 text-destructive">({failed} errores)</span>}
					</span>
				)}
			</div>
			<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					className={cn(
						'h-full rounded-full transition-all duration-dt-normal',
						isComplete && !hasErrors && 'bg-ui-success-text',
						isComplete && hasErrors && 'bg-ui-warning-text',
						!isComplete && 'bg-ui-info-text'
					)}
					style={{ width: `${progress}%` }}
				/>
			</div>
		</div>
	);
}

/* =====================================================
 * 🎭 CONTEXTUAL HINT
 * Sugerencia contextual no intrusiva
 * ===================================================== */

export interface ContextualHintProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Puede cerrarse */
	dismissible?: boolean;
	/** Icono */
	icon?: LucideIcon;
	/** Callback al cerrar */
	onDismiss?: () => void;
}

export function ContextualHint({
	icon: Icon = Info,
	dismissible = false,
	onDismiss,
	className,
	children,
	...props
}: ContextualHintProps) {
	const [visible, setVisible] = React.useState(true);

	if (!visible) return null;

	return (
		<div
			className={cn(
				'flex animate-slide-down items-start gap-3 rounded-lg border border-border/50 bg-muted/50 p-3 text-sm',
				className
			)}
			{...props}
		>
			<Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
			<div className="flex-1 text-muted-foreground">{children}</div>
			{dismissible && (
				<button
					aria-label="Cerrar"
					className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					onClick={() => {
						setVisible(false);
						onDismiss?.();
					}}
					type="button"
				>
					<XCircle className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
