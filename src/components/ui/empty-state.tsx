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
	/** Acciones disponibles */
	actions?: React.ReactNode;
	/** Descripción detallada */
	description: string;
	/** Icono a mostrar */
	icon: LucideIcon;
	/** Variante del icono */
	iconVariant?: 'default' | 'primary' | 'warning' | 'error' | 'success';
	/** Título principal */
	title: string;
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

interface PresetEmptyStateProps extends Omit<EmptyStateProps, 'icon'> {
	type: 'inbox' | 'search' | 'folder' | 'image' | 'error' | 'documents';
}

export function PresetEmptyState({ type, ...props }: PresetEmptyStateProps) {
	const presets = {
		inbox: { icon: Inbox, title: 'No hay elementos', description: 'Los nuevos elementos aparecerán aquí' },
		search: { icon: SearchX, title: 'Sin resultados', description: 'No se encontraron elementos con esos criterios' },
		folder: { icon: FolderOpen, title: 'Carpeta vacía', description: 'Arrastra archivos aquí o usa el botón de subir' },
		image: { icon: ImageOff, title: 'Sin imágenes', description: 'No hay imágenes para mostrar' },
		error: { icon: AlertCircle, title: 'Algo salió mal', description: 'Hubo un error al cargar los datos' },
		documents: { icon: FileQuestion, title: 'Sin documentos', description: 'No hay documentos para mostrar' },
	};

	const preset = presets[type];

	return <EmptyState {...props} description={preset.description} icon={preset.icon} title={preset.title} />;
}

/* =====================================================
 * 🔄 EMPTY STATE CON ACCIÓN
 * Con botón de acción integrado
 * ===================================================== */

interface ActionEmptyStateProps extends Omit<EmptyStateProps, 'actions'> {
	actionLabel: string;
	onAction: () => void;
}

export function ActionEmptyState({ actionLabel, onAction, ...props }: ActionEmptyStateProps) {
	return (
		<EmptyState
			{...props}
			actions={
				<Button onClick={onAction} variant="outline">
					{actionLabel}
				</Button>
			}
		/>
	);
}
