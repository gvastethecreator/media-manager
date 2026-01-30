import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Button variants con Design Tokens v2
 * - Bordes de 2px para mayor definición
 * - Sombras outset+inset por estado (idle, hover, active)
 * - Gradientes sutiles same-family para profundidad
 * - Border-pulse en active state
 * - Transiciones suaves con tokens de motion
 * - Touch targets accesibles (mínimo 44px)
 * - Focus visible mejorado
 */
const buttonVariants = cva(
	// Base: inline-flex para alineación, items-center para centrado vertical
	// gap-2 para espacio entre icono y texto
	// whitespace-nowrap para evitar saltos de línea
	// rounded-dt-sm para bordes consistentes
	// font-medium text-base para tipografía
	// transition-all para animaciones suaves
	// focus-visible para estados de foco accesibles
	// disabled para estados deshabilitados
	// [&_svg] para estilos de iconos internos
	'btn-pulse inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-dt-sm font-medium text-base transition-all duration-dt-normal ease-dt-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default:
					'border-2 border-primary/20 bg-linear-to-b from-primary to-primary/90 text-primary-foreground shadow-dt-2 hover:from-primary/95 hover:to-primary/85 hover:shadow-dt-3 active:translate-y-px active:shadow-dt-1',
				primary:
					'border-2 border-primary/20 bg-linear-to-b from-primary to-primary/90 text-primary-foreground shadow-dt-2 hover:from-primary/95 hover:to-primary/85 hover:shadow-dt-3 active:translate-y-px active:shadow-dt-1',
				destructive:
					'border-2 border-destructive/20 bg-linear-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-dt-2 hover:from-destructive/95 hover:to-destructive/85 hover:shadow-dt-3 active:translate-y-px active:shadow-dt-1',
				outline:
					'border-2 border-input bg-background shadow-dt-1 hover:border-accent hover:bg-accent hover:text-accent-foreground hover:shadow-dt-2 active:translate-y-px active:shadow-dt-0',
				secondary:
					'border-2 border-secondary/30 bg-linear-to-b from-secondary to-secondary/90 text-secondary-foreground shadow-dt-1 hover:from-secondary/95 hover:to-secondary/80 hover:shadow-dt-2 active:translate-y-px active:shadow-dt-0',
				dim: 'border-2 border-transparent bg-muted/40 text-muted-foreground shadow-dt-0 hover:bg-muted/60 hover:text-foreground hover:shadow-dt-1 active:translate-y-px active:bg-muted/70',
				ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-dt-1 active:bg-accent/80',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				// Touch targets mínimo 44px (WCAG 2.5.5)
				default: 'h-10 min-h-[44px] px-5 py-2.5',
				sm: 'h-9 min-h-[40px] rounded-dt-xs px-4 text-sm',
				md: 'h-10 min-h-[44px] px-5 py-2.5',
				lg: 'h-11 min-h-[48px] rounded-dt-md px-10 text-lg',
				icon: 'h-10 min-h-[44px] w-10 min-w-[44px]',
				xs: 'h-8 min-h-[36px] rounded-dt-xs px-3 text-xs',
			},
			// Variante para touch targets más grandes en móvil
			touch: {
				default: '',
				large: 'min-h-[48px] min-w-[48px]',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
			touch: 'default',
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	loading?: boolean;
	/**
	 * Prop legacy para algunos componentes (ej. data-grid) que lo usan
	 * como señal semántica (icon vs default). No afecta estilos: usa `size`.
	 */
	mode?: string;
	/** Si debe mostrar ripple effect al hacer click */
	ripple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			touch,
			mode: _mode,
			asChild = false,
			loading = false,
			children,
			disabled,
			ripple = false,
			onClick,
			...props
		},
		ref
	) => {
		const Comp = asChild ? Slot : 'button';

		// Handler para ripple effect
		const handleClick = React.useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				if (ripple && !disabled && !loading) {
					const button = e.currentTarget;
					const rect = button.getBoundingClientRect();
					const x = e.clientX - rect.left;
					const y = e.clientY - rect.top;

					const rippleElement = document.createElement('span');
					rippleElement.className = 'ripple-effect';
					rippleElement.style.cssText = `
						position: absolute;
						background: color-mix(in oklch, var(--primary-foreground) 30%, transparent);
						border-radius: 50%;
						transform: scale(0);
						animation: ripple 0.6s linear;
						left: ${x}px;
						top: ${y}px;
						width: 20px;
						height: 20px;
						margin-left: -10px;
						margin-top: -10px;
						pointer-events: none;
					`;

					button.style.position = 'relative';
					button.style.overflow = 'hidden';
					button.appendChild(rippleElement);

					setTimeout(() => rippleElement.remove(), 600);
				}

				onClick?.(e);
			},
			[ripple, disabled, loading, onClick]
		);

		return (
			<Comp
				aria-busy={loading}
				aria-disabled={loading || disabled}
				className={cn(buttonVariants({ variant, size, touch, className }))}
				disabled={loading || disabled}
				onClick={handleClick}
				ref={ref}
				{...props}
			>
				{loading && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
				{children}
			</Comp>
		);
	}
);
Button.displayName = 'Button';

export { Button, buttonVariants };

// CSS para ripple effect
const style = document.createElement('style');
style.textContent = `
	@keyframes ripple {
		to {
			transform: scale(4);
			opacity: 0;
		}
	}
`;
if (typeof document !== 'undefined') {
	document.head.appendChild(style);
}
