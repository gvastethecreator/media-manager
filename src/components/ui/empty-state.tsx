import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, FileQuestion, FolderOpen, ImageOff, Inbox, SearchX } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

/* =====================================================
 * 📭 EMPTY STATE v2.0
 * Estados vacíos significativos con feedback visual mejorado
 * ===================================================== */

const emptyStateVariants = cva('flex animate-fade-in flex-col items-center justify-center text-center', {
	variants: {
		size: {
			sm: 'gap-3 py-8',
			md: 'gap-4 py-12',
			lg: 'gap-5 py-16',
		},
		variant: {
			default: '',
			subtle: 'opacity-80',
			bordered: 'rounded-lg border-2 border-border/60 border-dashed',
			card: 'rounded-xl bg-muted/30 shadow-sm',
		},
	},
	defaultVariants: {
		size: 'md',
		variant: 'default',
	},
});

const iconContainerVariants = cva('flex items-center justify-center rounded-full transition-all duration-dt-normal', {
	variants: {
		size: {
			sm: 'h-12 w-12',
			md: 'h-16 w-16',
			lg: 'h-20 w-20',
		},
		iconVariant: {
			default: 'bg-muted text-muted-foreground',
			primary: 'bg-dt-primary-50 text-dt-primary-600',
			warning: 'bg-dt-warning-50 text-dt-warning-600',
			error: 'bg-dt-danger-50 text-dt-danger-600',
			success: 'bg-dt-success-50 text-dt-success-600',
		},
	},
	defaultVariants: {
		size: 'md',
		iconVariant: 'default',
	},
});

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof emptyStateVariants> {
	/** Icono a mostrar */
	icon: LucideIcon;
	/** Título principal */
	title: string;
	/** Descripción detallada */
	description: string;
	/** Acciones disponibles */
	actions?: React.ReactNode;
	/** Variante del icono */
	iconVariant?: 'default' | 'primary' | 'warning' | 'error' | 'success';
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	className,
	size,
	variant,
	iconVariant = 'default',
	actions,
	...props
}: EmptyStateProps) {
	const iconSizes = { sm: 20, md: 28, lg: 36 };
	const iconSize = iconSizes[size || 'md'];

	return (
		<div className={cn(emptyStateVariants({ size, variant }), className)} {...props}>
			<div className={cn(iconContainerVariants({ size, iconVariant }))}>
				<Icon className="animate-scale-in" size={iconSize} strokeWidth={1.5} />
			</div>
			<div className="max-w-md space-y-2">
				<h3 className="font-semibold text-foreground text-lg tracking-tight">{title}</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
			</div>
			{actions && (
				<div className="mt-4 flex animate-slide-up flex-wrap items-center justify-center gap-3">{actions}</div>
			)}
		</div>
	);
}

/* =====================================================
 * 🎯 PRESET EMPTY STATES
 * Estados vacíos predefinidos para casos comunes
 * ===================================================== */

export interface PresetEmptyStateProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
	/** Acción primaria */
	onPrimaryAction?: () => void;
	/** Texto del botón primario */
	primaryActionLabel?: string;
}

/** Estado vacío: Sin resultados de búsqueda */
export function EmptySearchResults({
	onPrimaryAction,
	primaryActionLabel = 'Limpiar búsqueda',
	...props
}: PresetEmptyStateProps) {
	return (
		<EmptyState
			actions={
				onPrimaryAction && (
					<Button onClick={onPrimaryAction} size="sm" variant="outline">
						{primaryActionLabel}
					</Button>
				)
			}
			description="No encontramos coincidencias para tu búsqueda. Intenta con otros términos o ajusta los filtros."
			icon={SearchX}
			iconVariant="warning"
			title="Sin resultados"
			{...props}
		/>
	);
}

/** Estado vacío: Carpeta vacía */
export function EmptyFolder({
	onPrimaryAction,
	primaryActionLabel = 'Agregar archivos',
	...props
}: PresetEmptyStateProps) {
	return (
		<EmptyState
			actions={
				onPrimaryAction && (
					<Button onClick={onPrimaryAction} size="sm">
						{primaryActionLabel}
					</Button>
				)
			}
			description="Esta carpeta no contiene archivos aún. Arrastra archivos aquí o usa el botón para agregarlos."
			icon={FolderOpen}
			iconVariant="primary"
			title="Carpeta vacía"
			{...props}
		/>
	);
}

/** Estado vacío: Sin imágenes */
export function EmptyImages({
	onPrimaryAction,
	primaryActionLabel = 'Subir imágenes',
	...props
}: PresetEmptyStateProps) {
	return (
		<EmptyState
			actions={
				onPrimaryAction && (
					<Button onClick={onPrimaryAction} size="sm">
						{primaryActionLabel}
					</Button>
				)
			}
			description="No hay imágenes disponibles. Sube imágenes para comenzar a organizar tu colección."
			icon={ImageOff}
			iconVariant="default"
			title="Sin imágenes"
			{...props}
		/>
	);
}

/** Estado vacío: Inbox vacío */
export function EmptyInbox({
	onPrimaryAction,
	primaryActionLabel = 'Importar contenido',
	...props
}: PresetEmptyStateProps) {
	return (
		<EmptyState
			actions={
				onPrimaryAction && (
					<Button onClick={onPrimaryAction} size="sm" variant="outline">
						{primaryActionLabel}
					</Button>
				)
			}
			description="No tienes elementos pendientes. Cuando haya contenido nuevo, aparecerá aquí."
			icon={Inbox}
			iconVariant="success"
			title="¡Todo al día!"
			{...props}
		/>
	);
}

/** Estado vacío: Archivo no encontrado */
export function EmptyNotFound({ ...props }: Omit<PresetEmptyStateProps, 'onPrimaryAction' | 'primaryActionLabel'>) {
	return (
		<EmptyState
			description="El recurso que buscas no existe o fue movido. Verifica la ruta o vuelve al inicio."
			icon={FileQuestion}
			iconVariant="warning"
			title="No encontrado"
			{...props}
		/>
	);
}

/** Estado vacío: Error */
export function EmptyError({ onPrimaryAction, primaryActionLabel = 'Reintentar', ...props }: PresetEmptyStateProps) {
	return (
		<EmptyState
			actions={
				onPrimaryAction && (
					<Button onClick={onPrimaryAction} size="sm" variant="destructive">
						{primaryActionLabel}
					</Button>
				)
			}
			description="Ocurrió un error inesperado. Por favor intenta de nuevo o contacta soporte si el problema persiste."
			icon={AlertCircle}
			iconVariant="error"
			title="Algo salió mal"
			{...props}
		/>
	);
}
