'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import gsap from 'gsap';
import * as React from 'react';
import { cn } from '@/lib/utils';

// Final GSAP-driven toolbar implementation.

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

const useToolbarAnimation = () => {
	const animateButtonHover = React.useCallback((element: HTMLElement, isHovering: boolean) => {
		if (!element) return;

		gsap.to(element, {
			backgroundColor: isHovering ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'transparent',
			scale: isHovering ? 1.05 : 1,
			duration: 0.15,
			ease: 'cubicBezier(0.4, 0, 0.2, 1)',
		});
	}, []);

	const animateButtonPressed = React.useCallback((element: HTMLElement, isPressed: boolean) => {
		if (!element) return;

		gsap.to(element, {
			scale: isPressed ? 0.95 : 1,
			backgroundColor: isPressed ? 'color-mix(in oklch, var(--accent) 20%, transparent)' : 'transparent',
			duration: 100,
			ease: 'easeOutQuad',
		});
	}, []);

	const animateToggle = React.useCallback((element: HTMLElement, isToggled: boolean) => {
		if (!element) return;

		gsap.to(element, {
			backgroundColor: isToggled ? 'color-mix(in oklch, var(--primary) 15%, transparent)' : 'transparent',
			borderColor: isToggled
				? 'color-mix(in oklch, var(--primary) 50%, transparent)'
				: 'color-mix(in oklch, var(--border) 20%, transparent)',
			duration: 0.2,
			ease: 'cubicBezier(0.4, 0, 0.2, 1)',
		});
	}, []);

	const animateSeparator = React.useCallback((element: HTMLElement) => {
		if (!element) return;

		gsap.fromTo(
			element,
			{
				opacity: 0.3,
			},
			{
				opacity: 1,
				duration: 0.2,
				ease: 'power1.inOut',
				yoyo: true,
				repeat: -1,
			}
		);
	}, []);

	return { animateButtonHover, animateButtonPressed, animateToggle, animateSeparator };
};

// ============================================================================
// TOOLBAR ROOT
// ============================================================================

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * Si se debe mostrar el borde del contenedor
	 * @default true
	 */
	bordered?: boolean;
	/**
	 * Orientación del toolbar
	 * @default "horizontal"
	 */
	orientation?: 'horizontal' | 'vertical';
}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
	({ className, bordered = true, orientation = 'horizontal', children, ...props }, ref) => (
		<div
			className={cn(
				'flex touch-none select-none',
				orientation === 'horizontal' ? 'h-12 items-center gap-1' : 'w-12 flex-col items-center gap-1',
				'relative rounded-dt-md',
				'bg-background/80 backdrop-blur-sm',
				'p-1.5',
				bordered && ['border-2 border-[oklch(from_var(--border)_l_c_h_/0.4)]', 'shadow-dt-1'],
				className
			)}
			data-orientation={orientation}
			ref={ref}
			{...props}
		>
			{children}
		</div>
	)
);
Toolbar.displayName = 'Toolbar';

// ============================================================================
// TOOLBAR BUTTON
// ============================================================================

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/**
	 * Si debe animar el estado pressed
	 * @default true
	 */
	animatePressed?: boolean;
	/**
	 * Icono opcional para mostrar en el botón
	 */
	icon?: React.ReactNode;
	/**
	 * Si el botón está en estado de toggle activo
	 * @default false
	 */
	pressed?: boolean;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
	(
		{ className, pressed, icon, children, animatePressed = true, onMouseDown, onMouseUp, onMouseLeave, ...props },
		ref
	) => {
		const buttonRef = React.useRef<HTMLButtonElement>(null);
		const { animateButtonHover, animateButtonPressed, animateToggle } = useToolbarAnimation();

		React.useImperativeHandle(ref, () => buttonRef.current!);

		// Animate toggle state changes
		React.useEffect(() => {
			if (buttonRef.current && pressed !== undefined) {
				animateToggle(buttonRef.current, pressed);
			}
		}, [pressed, animateToggle]);

		const handleMouseEnter = React.useCallback(() => {
			if (buttonRef.current) {
				animateButtonHover(buttonRef.current, true);
			}
		}, [animateButtonHover]);

		const handleMouseLeaveLocal = React.useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				if (buttonRef.current) {
					animateButtonHover(buttonRef.current, false);
					if (animatePressed) {
						animateButtonPressed(buttonRef.current, false);
					}
				}
				onMouseLeave?.(e);
			},
			[animateButtonHover, animateButtonPressed, animatePressed, onMouseLeave]
		);

		const handleMouseDownLocal = React.useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				if (buttonRef.current && animatePressed) {
					animateButtonPressed(buttonRef.current, true);
				}
				onMouseDown?.(e);
			},
			[animateButtonPressed, animatePressed, onMouseDown]
		);

		const handleMouseUpLocal = React.useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				if (buttonRef.current && animatePressed) {
					animateButtonPressed(buttonRef.current, false);
				}
				onMouseUp?.(e);
			},
			[animateButtonPressed, animatePressed, onMouseUp]
		);

		return (
			<button
				className={cn(
					'inline-flex items-center justify-center gap-2',
					'rounded-dt-sm font-medium text-base',
					'outline-none transition-all duration-dt-fast',
					'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					'disabled:pointer-events-none disabled:opacity-40',
					pressed && ['bg-primary/10 text-primary', 'border-2 border-primary/30', 'shadow-dt-inset-1'],
					!pressed && [
						'border-2 border-transparent',
						'hover:border-[oklch(from_var(--accent)_l_c_h_/0.25)]',
						'active:bg-accent/20',
					],
					className
				)}
				data-pressed={pressed}
				onMouseDown={handleMouseDownLocal}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeaveLocal}
				onMouseUp={handleMouseUpLocal}
				ref={buttonRef}
				type="button"
				{...props}
			>
				{icon && <span className="flex-shrink-0">{icon}</span>}
				{children}
			</button>
		);
	}
);
ToolbarButton.displayName = 'ToolbarButton';

// ============================================================================
// TOOLBAR TOGGLE ITEM (Using Radix Toggle Group)
// ============================================================================

interface ToolbarToggleItemProps extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> {
	/**
	 * Icono opcional para mostrar en el toggle
	 */
	icon?: React.ReactNode;
}

const ToolbarToggleItem = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Item>, ToolbarToggleItemProps>(
	({ className, icon, children, ...props }, ref) => {
		const toggleRef = React.useRef<HTMLButtonElement>(null);
		const { animateToggle } = useToolbarAnimation();

		React.useImperativeHandle(ref, () => toggleRef.current!);

		// Handle toggle state animation via data-state attribute
		React.useEffect(() => {
			if (toggleRef.current) {
				const observer = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
							const isPressed = toggleRef.current?.getAttribute('data-state') === 'on';
							animateToggle(toggleRef.current!, isPressed);
						}
					});
				});

				if (toggleRef.current) {
					observer.observe(toggleRef.current, { attributes: true });
				}

				return () => observer.disconnect();
			}
		}, [animateToggle]);

		return (
			<ToggleGroupPrimitive.Item
				className={cn(
					'inline-flex items-center justify-center gap-2',
					'rounded-dt-sm font-medium text-base',
					'outline-none transition-all duration-dt-normal',
					'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					'disabled:pointer-events-none disabled:opacity-40',
					// Base state
					'border-2 border-transparent',
					// Hover state
					'hover:border-[oklch(from_var(--accent)_l_c_h_/0.25)]',
					// Active/toggled state (data-state="on")
					'data-[state=on]:bg-primary/15 data-[state=on]:text-primary',
					'data-[state=on]:border-primary/40',
					'data-[state=on]:shadow-dt-inset-1',
					className
				)}
				ref={toggleRef}
				{...props}
			>
				{icon && <span className="flex-shrink-0">{icon}</span>}
				{children}
			</ToggleGroupPrimitive.Item>
		);
	}
);
ToolbarToggleItem.displayName = ToggleGroupPrimitive.Item.displayName;

// ============================================================================
// TOOLBAR TOGGLE GROUP
// ============================================================================

const ToolbarToggleGroup = React.forwardRef<
	React.ElementRef<typeof ToggleGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
	<ToggleGroupPrimitive.Root
		className={cn(
			'flex items-center gap-0.5',
			'rounded-dt-sm',
			'border-2 border-[oklch(from_var(--border)_l_c_h_/0.25)]',
			'bg-muted/30 p-0.5',
			'data-[orientation=vertical]:flex-col',
			className
		)}
		ref={ref}
		{...props}
	/>
));
ToolbarToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

// ============================================================================
// TOOLBAR LINK
// ============================================================================

interface ToolbarLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	icon?: React.ReactNode;
}

const ToolbarLink = React.forwardRef<HTMLAnchorElement, ToolbarLinkProps>(
	({ className, icon, children, ...props }, ref) => {
		const linkRef = React.useRef<HTMLAnchorElement>(null);
		const { animateButtonHover } = useToolbarAnimation();

		React.useImperativeHandle(ref, () => linkRef.current!);

		const handleMouseEnter = React.useCallback(() => {
			if (linkRef.current) {
				animateButtonHover(linkRef.current, true);
			}
		}, [animateButtonHover]);

		const handleMouseLeave = React.useCallback(() => {
			if (linkRef.current) {
				animateButtonHover(linkRef.current, false);
			}
		}, [animateButtonHover]);

		return (
			<a
				className={cn(
					'inline-flex items-center justify-center gap-2',
					'rounded-dt-sm font-medium text-base text-primary',
					'outline-none transition-all duration-dt-fast',
					'border-2 border-transparent',
					'hover:border-[oklch(from_var(--accent)_l_c_h_/0.25)]',
					'hover:underline hover:underline-offset-4',
					'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					className
				)}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				ref={linkRef}
				{...props}
			>
				{icon && <span className="flex-shrink-0">{icon}</span>}
				{children}
			</a>
		);
	}
);
ToolbarLink.displayName = 'ToolbarLink';

// ============================================================================
// TOOLBAR SEPARATOR
// ============================================================================

interface ToolbarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * Si se debe animar el separador
	 * @default false
	 */
	animated?: boolean;
}

const ToolbarSeparator = React.forwardRef<HTMLDivElement, ToolbarSeparatorProps>(
	({ className, animated = false, ...props }, ref) => {
		const separatorRef = React.useRef<HTMLDivElement>(null);
		const { animateSeparator } = useToolbarAnimation();

		React.useImperativeHandle(ref, () => separatorRef.current!);

		React.useEffect(() => {
			if (animated && separatorRef.current) {
				animateSeparator(separatorRef.current);
			}
		}, [animated, animateSeparator]);

		return (
			<div
				className={cn(
					'bg-[oklch(from_var(--border)_l_c_h_/0.4)]',
					// Horizontal separator
					'mx-1 h-6 w-px',
					// Vertical separator (when parent has data-orientation="vertical")
					'data-[orientation=vertical]:mx-0 data-[orientation=vertical]:my-1 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-6',
					className
				)}
				ref={separatorRef}
				{...props}
			/>
		);
	}
);
ToolbarSeparator.displayName = 'ToolbarSeparator';

// ============================================================================
// TOOLBAR GROUP
// ============================================================================

interface ToolbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(({ className, ...props }, ref) => (
	<div
		className={cn(
			'flex items-center gap-0.5',
			'data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-center',
			className
		)}
		ref={ref}
		{...props}
	/>
));
ToolbarGroup.displayName = 'ToolbarGroup';

// ============================================================================
// EXPORTS
// ============================================================================

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarLink, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem };

export type {
	ToolbarButtonProps,
	ToolbarGroupProps,
	ToolbarLinkProps,
	ToolbarProps,
	ToolbarSeparatorProps,
	ToolbarToggleItemProps,
};
