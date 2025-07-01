'use client';

import { Menu as MenuPrimitive } from '@base-ui-components/react/menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Context para manejar el estado del context menu
const ContextMenuContext = React.createContext<{
	open: boolean;
	setOpen: (open: boolean) => void;
	position: { x: number; y: number };
	setPosition: (position: { x: number; y: number }) => void;
	handleContextMenu: (event: React.MouseEvent) => void;
	handleClose: () => void;
}>({
	open: false,
	setOpen: () => { },
	position: { x: 0, y: 0 },
	setPosition: () => { },
	handleContextMenu: () => { },
	handleClose: () => { },
});

// Hook personalizado para manejar context menu
function useContextMenu() {
	const [open, setOpen] = React.useState(false);
	const [position, setPosition] = React.useState({ x: 0, y: 0 });

	const handleContextMenu = React.useCallback((event: React.MouseEvent) => {
		event.preventDefault();
		setPosition({ x: event.clientX, y: event.clientY });
		setOpen(true);
	}, []);

	const handleClose = React.useCallback(() => {
		setOpen(false);
	}, []);

	return {
		open,
		setOpen,
		position,
		setPosition,
		handleContextMenu,
		handleClose,
	};
}

function ContextMenu({ children, ...props }: { children: React.ReactNode }) {
	const contextMenu = useContextMenu();

	return (
		<ContextMenuContext.Provider value={{ ...contextMenu }}>
			<MenuPrimitive.Root open={contextMenu.open} onOpenChange={contextMenu.setOpen} {...props}>
				{children}
			</MenuPrimitive.Root>
		</ContextMenuContext.Provider>
	);
}

function ContextMenuTrigger({
	children,
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const { handleContextMenu } = React.useContext(ContextMenuContext);

	return (
		<div
			data-slot="context-menu-trigger"
			className={cn('cursor-default', className)}
			onContextMenu={handleContextMenu}
			role="button"
			tabIndex={0}
			{...props}
		>
			{children}
		</div>
	);
}

function ContextMenuContent({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const { open, position, handleClose } = React.useContext(ContextMenuContext);
	const contentRef = React.useRef<HTMLDivElement>(null);

	// Posicionar el menu en la posición del click
	React.useEffect(() => {
		if (open && contentRef.current) {
			const content = contentRef.current;
			const rect = content.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let x = position.x;
			let y = position.y;

			// Ajustar posición si se sale del viewport
			if (x + rect.width > viewportWidth) {
				x = viewportWidth - rect.width - 10;
			}
			if (y + rect.height > viewportHeight) {
				y = viewportHeight - rect.height - 10;
			}

			content.style.left = `${x}px`;
			content.style.top = `${y}px`;
		}
	}, [open, position]);

	// Cerrar al hacer click fuera
	React.useEffect(() => {
		if (!open) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
				handleClose();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handleClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [open, handleClose]);

	if (!open) return null;

	return (
		<MenuPrimitive.Portal>
			<div
				ref={contentRef}
				data-slot="context-menu-content"
				className={cn(
					'fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
					'animate-in fade-in-0 zoom-in-95',
					className
				)}
				style={{ position: 'fixed' }}
				{...props}
			>
				{children}
			</div>
		</MenuPrimitive.Portal>
	);
}

function ContextMenuItem({
	className,
	inset,
	children,
	onClick,
	disabled,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
	inset?: boolean;
	disabled?: boolean;
}) {
	const { handleClose } = React.useContext(ContextMenuContext);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled) return;
		onClick?.(event);
		handleClose();
	};

	return (
		<button
			type="button"
			data-slot="context-menu-item"
			data-disabled={disabled}
			className={cn(
				'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left border-none bg-transparent',
				inset && 'pl-8',
				disabled && 'pointer-events-none opacity-50',
				className
			)}
			onClick={handleClick}
			role="menuitem"
			disabled={disabled}
			aria-disabled={disabled}
			{...props}
		>
			{children}
		</button>
	);
}

function ContextMenuCheckboxItem({
	className,
	children,
	checked,
	onCheckedChange,
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}) {
	const { handleClose } = React.useContext(ContextMenuContext);

	const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		onCheckedChange?.(!checked);
		// No cerrar automáticamente para checkbox items
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onCheckedChange?.(!checked);
		}
	};

	return (
		<div
			data-slot="context-menu-checkbox-item"
			className={cn(
				'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				className
			)}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="menuitemcheckbox"
			tabIndex={0}
			aria-checked={checked}
			{...props}
		>
			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
				{checked && <CheckIcon className="h-4 w-4" />}
			</span>
			{children}
		</div>
	);
}

function ContextMenuRadioItem({
	className,
	children,
	value,
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	value?: string;
}) {
	return (
		<div
			data-slot="context-menu-radio-item"
			className={cn(
				'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				className
			)}
			{...props}
		>
			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
				<CircleIcon className="h-2 w-2 fill-current" />
			</span>
			{children}
		</div>
	);
}

function ContextMenuLabel({
	className,
	inset,
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	inset?: boolean;
}) {
	return (
		<div
			data-slot="context-menu-label"
			className={cn('px-2 py-1.5 text-sm font-semibold text-foreground', inset && 'pl-8', className)}
			{...props}
		/>
	);
}

function ContextMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="context-menu-separator"
			className={cn('-mx-1 my-1 h-px bg-border', className)}
			{...props}
		/>
	);
}

function ContextMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			data-slot="context-menu-shortcut"
			className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
			{...props}
		/>
	);
}

// Componentes de grupo para organización
function ContextMenuGroup({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div data-slot="context-menu-group" {...props} />;
}

function ContextMenuPortal({ children }: { children: React.ReactNode }) {
	return <MenuPrimitive.Portal>{children}</MenuPrimitive.Portal>;
}

// Componentes de submenu (implementación simplificada)
function ContextMenuSub({ children, ...props }: { children: React.ReactNode }) {
	return <div data-slot="context-menu-sub" {...props}>{children}</div>;
}

function ContextMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	inset?: boolean;
}) {
	return (
		<div
			data-slot="context-menu-sub-trigger"
			className={cn(
				'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent data-[state=open]:bg-accent',
				inset && 'pl-8',
				className
			)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto h-4 w-4" />
		</div>
	);
}

function ContextMenuSubContent({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="context-menu-sub-content"
			className={cn(
				'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
				className
			)}
			{...props}
		/>
	);
}

function ContextMenuRadioGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div data-slot="context-menu-radio-group" {...props}>{children}</div>;
}

export {
	ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator,
	ContextMenuShortcut, ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger, ContextMenuTrigger
};

