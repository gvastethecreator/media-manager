import {
	Album,
	Archive,
	Bookmark,
	ChevronRight,
	Copy,
	Download,
	Eye,
	FolderOpen,
	Hash,
	Heart,
	Loader2,
	MapPin,
	Pencil,
	Plus,
	Sparkles,
	Tag,
	Trash2,
	Users,
	Wand2,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { type EntityOption, useContextMenuEntities } from '@/hooks/use-context-menu-entities';
import { cn } from '@/lib/utils';
import type { ContextMenuAction } from './types';

// Extensión de las acciones existentes con las nuevas entidades
export type ExtendedContextMenuAction =
	| ContextMenuAction
	| 'add-to-album'
	| 'add-to-collection'
	| 'add-to-group'
	| 'add-to-tag'
	| 'add-to-world-item'
	| 'add-to-characters'
	| 'add-to-concept'
	| 'add-to-notes'
	| 'add-to-places'
	| 'add-to-prompts'
	| 'add-to-properties'
	| 'add-to-wildcards'
	| 'add-to-favorites';

export interface ExtendedContextMenuProps<T = unknown> {
	isOpen: boolean;
	position: { x: number; y: number } | null;
	selectedItems: T[];
	// payload.selected: elementos seleccionados; payload.targetId: id de la entidad destino (colección, tag, etc.)
	onAction: (action: ExtendedContextMenuAction, payload: { selected: T[]; targetId?: string }) => void;
	onClose: () => void;
}

interface MenuItemProps {
	icon: React.ReactNode;
	label: string;
	action?: ExtendedContextMenuAction;
	onSelect?: (action: ExtendedContextMenuAction) => void;
	onClick?: () => void;
	disabled?: boolean;
	destructive?: boolean;
	submenu?: React.ReactNode;
}

function MenuItem({
	icon,
	label,
	action,
	onSelect,
	onClick,
	disabled = false,
	destructive = false,
	submenu,
}: MenuItemProps) {
	const handleClick = () => {
		if (disabled) return;
		if (onClick) {
			onClick();
		} else if (action && onSelect) {
			onSelect(action);
		}
	};

	return (
		<div className="group relative">
			<button
				className={cn(
					'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm',
					'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
					'focus:outline-none disabled:pointer-events-none disabled:opacity-50',
					destructive && 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
				)}
				disabled={disabled}
				onClick={handleClick}
				type="button"
			>
				<span className="h-4 w-4 flex-shrink-0">{icon}</span>
				<span className="flex-1">{label}</span>
				{submenu && <ChevronRight className="h-4 w-4" />}
			</button>
			{submenu && (
				<div className="invisible absolute top-0 left-full z-50 ml-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
					{submenu}
				</div>
			)}
		</div>
	);
}

function MenuSeparator() {
	return <div className="my-1 h-px bg-border" />;
}

function SubMenu({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={cn('min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md', className)}>
			{children}
		</div>
	);
}

// Componente para renderizar items de entidad con loading
function EntityMenuItem({
	entities,
	isLoading,
	icon,
	baseAction,
	label,
	onSelect,
}: {
	entities: EntityOption[];
	isLoading: boolean;
	icon: React.ReactNode;
	baseAction: string;
	label: string;
	onSelect: (action: ExtendedContextMenuAction, entityId?: string) => void;
}) {
	// Control explícito de apertura del submenú (evita solapamiento al abrir el menú)
	const [open, setOpen] = React.useState(false);
	const hoverTimeout = React.useRef<number | null>(null);

	const openWithDelay = () => {
		if (hoverTimeout.current) {
			window.clearTimeout(hoverTimeout.current);
			hoverTimeout.current = null;
		}
		hoverTimeout.current = window.setTimeout(() => setOpen(true), 80);
	};

	const closeWithDelay = () => {
		if (hoverTimeout.current) {
			window.clearTimeout(hoverTimeout.current);
			hoverTimeout.current = null;
		}
		hoverTimeout.current = window.setTimeout(() => setOpen(false), 120);
	};

	React.useEffect(() => {
		return () => {
			if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
		};
	}, []);

	if (isLoading) {
		return (
			<div className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-muted-foreground text-sm">
				{icon}
				<span className="ml-2">{label}</span>
				<Loader2 className="ml-auto h-4 w-4 animate-spin" />
			</div>
		);
	}

	if (entities.length === 0) {
		return (
			<div className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-muted-foreground text-sm">
				{icon}
				<span className="ml-2">{label}</span>
				<Plus className="ml-auto h-4 w-4" />
			</div>
		);
	}

	return (
		<div className="group relative">
			<button
				aria-expanded={open}
				aria-haspopup="menu"
				className={cn(
					'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
					'hover:bg-accent hover:text-accent-foreground',
					'focus:bg-accent focus:text-accent-foreground'
				)}
				onBlur={closeWithDelay}
				onFocus={openWithDelay}
				onMouseEnter={openWithDelay}
				onMouseLeave={closeWithDelay}
				type="button"
			>
				{icon}
				<span className="ml-2">{label}</span>
				<ChevronRight className="ml-auto h-4 w-4" />
			</button>
			<div
				aria-hidden={!open}
				className={cn(
					'absolute top-0 left-full z-50 ml-1',
					open ? 'visible opacity-100' : 'invisible opacity-0',
					'transition-all duration-150',
					open ? 'translate-x-0' : 'translate-x-1'
				)}
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={closeWithDelay}
				role="menu"
				tabIndex={0}
			>
				{open && (
					<SubMenu className="max-h-64 overflow-y-auto">
						{entities.map((entity) => (
							<button
								className={cn(
									'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
									'hover:bg-accent hover:text-accent-foreground',
									'focus:bg-accent focus:text-accent-foreground'
								)}
								key={entity.id}
								onClick={() => onSelect(baseAction as ExtendedContextMenuAction, entity.id)}
								type="button"
							>
								{entity.icon ? <span className="mr-2">{entity.icon}</span> : icon}
								<span className="truncate">{entity.name}</span>
							</button>
						))}
					</SubMenu>
				)}
			</div>
		</div>
	);
}

export function ExtendedContextMenu<T>({
	isOpen,
	position,
	selectedItems,
	onAction,
	onClose,
}: ExtendedContextMenuProps<T>) {
	const menuRef = useRef<HTMLDivElement>(null);

	// Hook para obtener entidades disponibles
	const { entities, isLoading } = useContextMenuEntities();

	const handleSelect = (action: ExtendedContextMenuAction, entityId?: string) => {
		onAction(action, { selected: selectedItems, targetId: entityId });
		onClose();
	};

	const selectedCount = selectedItems.length;
	const hasSelection = selectedCount > 0;

	// Cerrar menú al hacer click fuera
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	if (!position) {
		return null;
	}

	// Submenú "Agregar a..."
	const addToSubmenu = (
		<SubMenu>
			<EntityMenuItem
				baseAction="add-to-album"
				entities={entities.albums}
				icon={<Album className="h-4 w-4" />}
				isLoading={isLoading}
				label="Album"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-collection"
				entities={entities.collections}
				icon={<Archive className="h-4 w-4" />}
				isLoading={isLoading}
				label="Colección"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-group"
				entities={entities.groups}
				icon={<Users className="h-4 w-4" />}
				isLoading={isLoading}
				label="Grupo"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-tag"
				entities={entities.tags}
				icon={<Tag className="h-4 w-4" />}
				isLoading={isLoading}
				label="Tag"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-world-item"
				entities={entities.worldItems}
				icon={<Sparkles className="h-4 w-4" />}
				isLoading={isLoading}
				label="World Item"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-characters"
				entities={entities.characters}
				icon={<Users className="h-4 w-4" />}
				isLoading={isLoading}
				label="Characters"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-concept"
				entities={entities.concepts}
				icon={<Hash className="h-4 w-4" />}
				isLoading={isLoading}
				label="Concept"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-notes"
				entities={entities.notes}
				icon={<Pencil className="h-4 w-4" />}
				isLoading={isLoading}
				label="Notes"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-places"
				entities={entities.places}
				icon={<MapPin className="h-4 w-4" />}
				isLoading={isLoading}
				label="Places"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-prompts"
				entities={entities.prompts}
				icon={<Sparkles className="h-4 w-4" />}
				isLoading={isLoading}
				label="Prompts"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-properties"
				entities={entities.properties}
				icon={<Hash className="h-4 w-4" />}
				isLoading={isLoading}
				label="Properties"
				onSelect={handleSelect}
			/>
			<EntityMenuItem
				baseAction="add-to-wildcards"
				entities={entities.wildcards}
				icon={<Wand2 className="h-4 w-4" />}
				isLoading={isLoading}
				label="Wildcards"
				onSelect={handleSelect}
			/>
			<MenuSeparator />
			<MenuItem
				action="add-to-favorites"
				icon={<Heart className="h-4 w-4" />}
				label="Favorites"
				onSelect={handleSelect}
			/>
		</SubMenu>
	);

	return (
		<div
			className="fixed z-50 min-w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
			ref={menuRef}
			style={{
				left: position.x,
				top: position.y,
			}}
		>
			{hasSelection && (
				<>
					<MenuItem
						action="open"
						icon={<FolderOpen className="h-4 w-4" />}
						label={`Abrir${selectedCount > 1 ? ` (${selectedCount})` : ''}`}
						onSelect={handleSelect}
					/>
					<MenuItem action="preview" icon={<Eye className="h-4 w-4" />} label="Vista previa" onSelect={handleSelect} />

					<MenuSeparator />

					<MenuItem action="copy" icon={<Copy className="h-4 w-4" />} label="Copiar" onSelect={handleSelect} />
					<MenuItem
						action="rename"
						disabled={selectedCount > 1}
						icon={<Pencil className="h-4 w-4" />}
						label="Renombrar"
						onSelect={handleSelect}
					/>

					<MenuSeparator />

					<MenuItem icon={<Bookmark className="h-4 w-4" />} label="Agregar a..." submenu={addToSubmenu} />

					<MenuSeparator />

					<MenuItem
						action="download"
						icon={<Download className="h-4 w-4" />}
						label="Descargar"
						onSelect={handleSelect}
					/>

					<MenuSeparator />

					<MenuItem
						action="delete"
						destructive
						icon={<Trash2 className="h-4 w-4" />}
						label="Eliminar"
						onSelect={handleSelect}
					/>
				</>
			)}

			{!hasSelection && <MenuItem disabled icon={<div className="h-4 w-4" />} label="Sin elementos seleccionados" />}
		</div>
	);
}
