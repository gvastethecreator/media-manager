'use client';

import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { animate } from 'animejs';
import { Check, ChevronRight, Circle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

const useMenubarAnimation = () => {
	const animateContent = React.useCallback((element: HTMLElement, isOpen: boolean) => {
		if (!element) return;

		if (isOpen) {
			animate(element, {
				opacity: [0, 1],
				translateY: [-8, 0],
				scale: [0.95, 1],
				duration: 200,
				ease: 'cubicBezier(0.4, 0, 0.2, 1)',
			});
		} else {
			animate(element, {
				opacity: [1, 0],
				translateY: [0, -4],
				scale: [1, 0.98],
				duration: 150,
				ease: 'cubicBezier(0.4, 0, 1, 1)',
			});
		}
	}, []);

	const animateSubContent = React.useCallback((element: HTMLElement, isOpen: boolean) => {
		if (!element) return;

		if (isOpen) {
			animate(element, {
				opacity: [0, 1],
				translateX: [-8, 0],
				duration: 150,
				ease: 'cubicBezier(0.4, 0, 0.2, 1)',
			});
		}
	}, []);

	const animateItemHover = React.useCallback((element: HTMLElement, isHovering: boolean) => {
		if (!element) return;

		animate(element, {
			backgroundColor: isHovering ? 'color-mix(in oklch, var(--accent) 15%, transparent)' : 'transparent',
			scale: isHovering ? 1.02 : 1,
			duration: 150,
			ease: 'cubicBezier(0.4, 0, 0.2, 1)',
		});
	}, []);

	const animateTriggerHover = React.useCallback((element: HTMLElement, isHovering: boolean) => {
		if (!element) return;

		animate(element, {
			backgroundColor: isHovering ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'transparent',
			duration: 200,
			ease: 'easeOutQuad',
		});
	}, []);

	return { animateContent, animateSubContent, animateItemHover, animateTriggerHover };
};

// ============================================================================
// MENU COMPONENTS
// ============================================================================

function MenubarMenu({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
	return <MenubarPrimitive.Menu {...props} />;
}

function MenubarGroup({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Group>) {
	return <MenubarPrimitive.Group {...props} />;
}

function MenubarPortal({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
	return <MenubarPrimitive.Portal {...props} />;
}

function MenubarRadioGroup({ ...props }: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
	return <MenubarPrimitive.RadioGroup {...props} />;
}

function MenubarSub({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
	return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

// ============================================================================
// MENUBAR ROOT
// ============================================================================

const Menubar = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
	<MenubarPrimitive.Root
		className={cn(
			'flex h-12 items-center gap-1 rounded-dt-md',
			'border-2 border-[oklch(from_var(--border)_l_c_h_/0.4)]',
			'bg-background/80 backdrop-blur-sm',
			'p-1.5 shadow-dt-1',
			className
		)}
		ref={ref}
		{...props}
	/>
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

// ============================================================================
// MENUBAR TRIGGER
// ============================================================================

const MenubarTrigger = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => {
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const { animateTriggerHover } = useMenubarAnimation();

	React.useImperativeHandle(ref, () => triggerRef.current!);

	const handleMouseEnter = React.useCallback(() => {
		if (triggerRef.current) {
			animateTriggerHover(triggerRef.current, true);
		}
	}, [animateTriggerHover]);

	const handleMouseLeave = React.useCallback(() => {
		if (triggerRef.current) {
			animateTriggerHover(triggerRef.current, false);
		}
	}, [animateTriggerHover]);

	return (
		<MenubarPrimitive.Trigger
			className={cn(
				'flex cursor-default select-none items-center rounded-dt-sm',
				'px-4 py-2 font-medium text-base',
				'outline-none transition-all duration-dt-normal',
				'border-2 border-transparent',
				'data-[state=open]:border-[oklch(from_var(--accent)_l_c_h_/0.3)]',
				'data-[state=open]:bg-accent/10',
				'data-[state=open]:text-accent-foreground',
				'data-[state=open]:shadow-dt-inset-1',
				'disabled:pointer-events-none disabled:opacity-40',
				className
			)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			ref={triggerRef}
			{...props}
		/>
	);
});
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

// ============================================================================
// MENUBAR SUB TRIGGER (Nested Menus)
// ============================================================================

const MenubarSubTrigger = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
		inset?: boolean;
	}
>(({ className, inset, children, ...props }, ref) => {
	const triggerRef = React.useRef<HTMLDivElement>(null);
	const { animateItemHover } = useMenubarAnimation();

	React.useImperativeHandle(ref, () => triggerRef.current!);

	const handleMouseEnter = React.useCallback(() => {
		if (triggerRef.current) {
			animateItemHover(triggerRef.current, true);
		}
	}, [animateItemHover]);

	const handleMouseLeave = React.useCallback(() => {
		if (triggerRef.current) {
			animateItemHover(triggerRef.current, false);
		}
	}, [animateItemHover]);

	return (
		<MenubarPrimitive.SubTrigger
			className={cn(
				'flex cursor-default select-none items-center rounded-dt-sm',
				'px-3 py-2.5 text-base',
				'outline-none transition-all duration-dt-fast',
				'focus:bg-accent/15 focus:text-accent-foreground',
				'data-[state=open]:bg-accent/15 data-[state=open]:text-accent-foreground',
				'disabled:pointer-events-none disabled:opacity-40',
				inset && 'pl-8',
				className
			)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			ref={triggerRef}
			{...props}
		>
			{children}
			<ChevronRight className="ml-auto h-4 w-4 opacity-60" />
		</MenubarPrimitive.SubTrigger>
	);
});
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

// ============================================================================
// MENUBAR SUB CONTENT (Nested Menu Content)
// ============================================================================

const MenubarSubContent = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.SubContent>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => {
	const contentRef = React.useRef<HTMLDivElement>(null);
	const { animateSubContent } = useMenubarAnimation();

	React.useImperativeHandle(ref, () => contentRef.current!);

	React.useEffect(() => {
		if (contentRef.current) {
			animateSubContent(contentRef.current, true);
		}
	}, [animateSubContent]);

	return (
		<MenubarPrimitive.SubContent
			className={cn(
				'z-50 min-w-[10rem] overflow-hidden rounded-dt-md',
				'border-2 border-[oklch(from_var(--border)_l_c_h_/0.35)]',
				'bg-popover/95 backdrop-blur-md',
				'p-1.5 shadow-dt-3',
				'origin-[--radix-menubar-content-transform-origin]',
				className
			)}
			ref={contentRef}
			{...props}
		/>
	);
});
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

// ============================================================================
// MENUBAR CONTENT (Main Menu)
// ============================================================================

const MenubarContent = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = 'start', alignOffset = -4, sideOffset = 8, ...props }, ref) => {
	const contentRef = React.useRef<HTMLDivElement>(null);
	const { animateContent } = useMenubarAnimation();
	const [isOpen, setIsOpen] = React.useState(false);

	React.useImperativeHandle(ref, () => contentRef.current!);

	// Track open state through Radix's onInteractOutside or other means
	React.useEffect(() => {
		if (contentRef.current) {
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
						const state = contentRef.current?.getAttribute('data-state');
						const newIsOpen = state === 'open';
						if (newIsOpen !== isOpen) {
							setIsOpen(newIsOpen);
							animateContent(contentRef.current!, newIsOpen);
						}
					}
				});
			});

			if (contentRef.current) {
				observer.observe(contentRef.current, { attributes: true });
			}

			return () => observer.disconnect();
		}
	}, [animateContent, isOpen]);

	return (
		<MenubarPrimitive.Portal>
			<MenubarPrimitive.Content
				align={align}
				alignOffset={alignOffset}
				className={cn(
					'z-50 min-w-[12rem] overflow-hidden rounded-dt-md',
					'border-2 border-[oklch(from_var(--border)_l_c_h_/0.35)]',
					'bg-popover/95 backdrop-blur-md',
					'p-1.5 shadow-dt-3',
					'origin-[--radix-menubar-content-transform-origin]',
					className
				)}
				ref={contentRef}
				sideOffset={sideOffset}
				{...props}
			/>
		</MenubarPrimitive.Portal>
	);
});
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

// ============================================================================
// MENUBAR ITEM
// ============================================================================

const MenubarItem = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => {
	const itemRef = React.useRef<HTMLDivElement>(null);
	const { animateItemHover } = useMenubarAnimation();

	React.useImperativeHandle(ref, () => itemRef.current!);

	const handleMouseEnter = React.useCallback(() => {
		if (itemRef.current) {
			animateItemHover(itemRef.current, true);
		}
	}, [animateItemHover]);

	const handleMouseLeave = React.useCallback(() => {
		if (itemRef.current) {
			animateItemHover(itemRef.current, false);
		}
	}, [animateItemHover]);

	return (
		<MenubarPrimitive.Item
			className={cn(
				'relative flex cursor-default select-none items-center rounded-dt-sm',
				'px-3 py-2.5 text-base',
				'outline-none transition-all duration-dt-fast',
				'focus:bg-accent/15 focus:text-accent-foreground',
				'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
				inset && 'pl-8',
				className
			)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			ref={itemRef}
			{...props}
		/>
	);
});
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

// ============================================================================
// MENUBAR CHECKBOX ITEM
// ============================================================================

const MenubarCheckboxItem = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
	const itemRef = React.useRef<HTMLDivElement>(null);
	const { animateItemHover } = useMenubarAnimation();

	React.useImperativeHandle(ref, () => itemRef.current!);

	const handleMouseEnter = React.useCallback(() => {
		if (itemRef.current) {
			animateItemHover(itemRef.current, true);
		}
	}, [animateItemHover]);

	const handleMouseLeave = React.useCallback(() => {
		if (itemRef.current) {
			animateItemHover(itemRef.current, false);
		}
	}, [animateItemHover]);

	return (
		<MenubarPrimitive.CheckboxItem
			checked={checked}
			className={cn(
				'relative flex cursor-default select-none items-center rounded-dt-sm',
				'py-2.5 pr-3 pl-8 text-base',
				'outline-none transition-all duration-dt-fast',
				'focus:bg-accent/15 focus:text-accent-foreground',
				'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
				className
			)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			ref={itemRef}
			{...props}
		>
			<span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
				<MenubarPrimitive.ItemIndicator>
					<Check className="h-4 w-4 text-primary" />
				</MenubarPrimitive.ItemIndicator>
			</span>
			{children}
		</MenubarPrimitive.CheckboxItem>
	);
});
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

// ============================================================================
// MENUBAR RADIO ITEM
// ============================================================================

const MenubarRadioItem = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.RadioItem>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
	const itemRef = React.useRef<HTMLDivElement>(null);
	const { animateItemHover } = useMenubarAnimation();

	React.useImperativeHandle(ref, () => itemRef.current!);

	const handleMouseEnter = React.useCallback(() => {
		if (itemRef.current) {
			animateItemHover(itemRef.current, true);
		}
	}, [animateItemHover]);

	const handleMouseLeave = React.useCallback(() => {
		if (itemRef.current) {
			animateItemHover(itemRef.current, false);
		}
	}, [animateItemHover]);

	return (
		<MenubarPrimitive.RadioItem
			className={cn(
				'relative flex cursor-default select-none items-center rounded-dt-sm',
				'py-2.5 pr-3 pl-8 text-base',
				'outline-none transition-all duration-dt-fast',
				'focus:bg-accent/15 focus:text-accent-foreground',
				'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
				className
			)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			ref={itemRef}
			{...props}
		>
			<span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
				<MenubarPrimitive.ItemIndicator>
					<Circle className="h-2.5 w-2.5 fill-current text-primary" />
				</MenubarPrimitive.ItemIndicator>
			</span>
			{children}
		</MenubarPrimitive.RadioItem>
	);
});
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

// ============================================================================
// MENUBAR LABEL
// ============================================================================

const MenubarLabel = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<MenubarPrimitive.Label
		className={cn('px-3 py-2 font-semibold text-muted-foreground text-sm', inset && 'pl-8', className)}
		ref={ref}
		{...props}
	/>
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

// ============================================================================
// MENUBAR SEPARATOR
// ============================================================================

const MenubarSeparator = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<MenubarPrimitive.Separator
		className={cn(
			'-mx-1.5 my-1.5 h-px',
			'bg-[linear-gradient(90deg,transparent,oklch(from_var(--border)_l_c_h_/0.6),transparent)]',
			className
		)}
		ref={ref}
		{...props}
	/>
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

// ============================================================================
// MENUBAR SHORTCUT
// ============================================================================

const MenubarShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span className={cn('ml-auto text-muted-foreground text-xs tracking-widest', 'opacity-70', className)} {...props} />
	);
};
MenubarShortcut.displayName = 'MenubarShortcut';

// ============================================================================
// EXPORTS
// ============================================================================

export {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarGroup,
	MenubarItem,
	MenubarLabel,
	MenubarMenu,
	MenubarPortal,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
};
