import { ChevronLeft, MoreHorizontal, PencilIcon, StarIcon, TrashIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { Link } from 'react-router-dom';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EntityStats, StatItem } from '@/components/ui/entity-stats';
import { cn } from '@/lib/utils';

export interface EntityHeaderAction {
	/**
	 * Etiqueta para el botón
	 */
	label: string;

	/**
	 * Icono para el botón
	 */
	icon?: React.ReactNode;

	/**
	 * Función a ejecutar al hacer clic
	 */
	onClick?: () => void;

	/**
	 * URL para navegación
	 */
	href?: string;

	/**
	 * Variante del botón
	 */
	variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';

	/**
	 * Si mostrar en el menú desplegable en lugar de como botón independiente
	 */
	inDropdown?: boolean;

	/**
	 * Posición en la lista (menor número = más a la izquierda)
	 */
	order?: number;
}

export interface EntityHeaderProps {
	/**
	 * Título principal
	 */
	title: string;

	/**
	 * Subtítulo opcional
	 */
	subtitle?: string;

	/**
	 * Descripción opcional
	 */
	description?: string;

	/**
	 * Icono para mostrar junto al título
	 */
	icon?: React.ReactNode;

	/**
	 * URL de retorno (generalmente a la página de listado)
	 */
	backUrl?: string;

	/**
	 * Texto para el enlace de retorno
	 */
	backLabel?: string;

	/**
	 * Color principal
	 */
	primaryColor?: string;

	/**
	 * Items de estadísticas para mostrar
	 */
	stats?: StatItem[];

	/**
	 * Acciones disponibles para la entidad
	 */
	actions?: EntityHeaderAction[];

	/**
	 * URL de imagen destacada
	 */
	featuredImage?: string;

	/**
	 * Items para la ruta de navegación (breadcrumbs)
	 */
	breadcrumbItems?: Array<{
		label: string;
		href?: string;
	}>;

	/**
	 * Si es favorito
	 */
	isFavorite?: boolean;

	/**
	 * Función para cambiar estado de favorito
	 */
	onToggleFavorite?: () => void;

	/**
	 * Si se debe mostrar el botón de favorito
	 */
	showFavoriteButton?: boolean;

	/**
	 * Clases adicionales para el contenedor
	 */
	className?: string;

	/**
	 * Contenido personalizado para la sección derecha
	 */
	rightContent?: React.ReactNode;
}

/**
 * Componente de encabezado para páginas de entidades.
 * Incluye título, descripción, breadcrumbs, acciones y estadísticas.
 */
export function EntityHeader({
	title,
	subtitle,
	description,
	icon,
	backUrl,
	backLabel = 'Volver',
	primaryColor = '#3b82f6',
	stats,
	actions = [],
	featuredImage,
	breadcrumbItems = [],
	isFavorite = false,
	onToggleFavorite,
	showFavoriteButton = false,
	className,
	rightContent,
}: EntityHeaderProps) {
	// Ordenar acciones
	const sortedActions = [...actions].sort(
		(a, b) => (a.order || Number.POSITIVE_INFINITY) - (b.order || Number.POSITIVE_INFINITY)
	);

	// Separar acciones normales y del menú desplegable
	const mainActions = sortedActions.filter((action) => !action.inDropdown);
	const dropdownActions = sortedActions.filter((action) => action.inDropdown);

	// Renderizar un botón de acción
	const renderActionButton = (action: EntityHeaderAction, index: number) => {
		const buttonContent = (
			<>
				{action.icon && <span className="mr-2">{action.icon}</span>}
				{action.label}
			</>
		);

		if (action.href) {
			return (
				<Button key={`action-${index}`} variant={action.variant || 'default'} size="sm" asChild>
					<a href={action.href}>{buttonContent}</a>
				</Button>
			);
		}

		return (
			<Button key={`action-${index}`} variant={action.variant || 'default'} size="sm" onClick={action.onClick}>
				{buttonContent}
			</Button>
		);
	};

	// Acciones predefinidas comunes
	const _editAction: EntityHeaderAction = {
		label: 'Editar',
		icon: <PencilIcon className="h-4 w-4" />,
		variant: 'outline',
		order: 10,
	};

	const _deleteAction: EntityHeaderAction = {
		label: 'Eliminar',
		icon: <TrashIcon className="h-4 w-4" />,
		variant: 'destructive',
		inDropdown: true,
		order: 100,
	};

	return (
		<div className={cn('space-y-4', className)}>
			{/* Breadcrumbs */}
			{(breadcrumbItems.length > 0 || backUrl) && (
				<Breadcrumb className="mb-4">
					<BreadcrumbList>
						{backUrl && (
							<BreadcrumbItem>
								<BreadcrumbLink href={backUrl} className="flex items-center">
									<ChevronLeft className="h-4 w-4 mr-1" />
									{backLabel}
								</BreadcrumbLink>
							</BreadcrumbItem>
						)}

						{breadcrumbItems.map((item, index) => (
							<React.Fragment key={`${item.label}-${item.href || index}`}>
								{(backUrl || index > 0) && <BreadcrumbSeparator />}
								<BreadcrumbItem>
									{item.href ? <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink> : <span>{item.label}</span>}
								</BreadcrumbItem>
							</React.Fragment>
						))}
					</BreadcrumbList>
				</Breadcrumb>
			)}

			{/* Contenedor principal */}
			<div className="flex flex-col sm:flex-row justify-between gap-4">
				{/* Columna izquierda: título e información */}
				<div className="space-y-2 flex-1">
					{/* Encabezado */}
					<div className="flex items-center gap-2">
						{icon && (
							<div
								className="w-8 h-8 flex items-center justify-center rounded-full"
								style={{ backgroundColor: `${primaryColor}20` }}
							>
								{icon}
							</div>
						)}
						<div>
							<h1 className="text-3xl font-bold flex items-center gap-2">
								{title}
								{showFavoriteButton && onToggleFavorite && (
									<button
										type="button"
										onClick={onToggleFavorite}
										className="focus:outline-none"
										aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
									>
										<StarIcon
											className={cn(
												'h-5 w-5 transition-colors',
												isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'
											)}
										/>
									</button>
								)}
							</h1>
							{subtitle && <p className="text-muted-foreground">{subtitle}</p>}
						</div>
					</div>

					{/* Descripción */}
					{description && <p className="text-muted-foreground max-w-2xl">{description}</p>}

					{/* Estadísticas */}
					{stats && stats.length > 0 && (
						<div className="pt-1">
							<EntityStats stats={stats} primaryColor={primaryColor} asBadges={true} animated={true} />
						</div>
					)}
				</div>

				{/* Columna derecha: acciones o contenido personalizado */}
				<div className="flex flex-wrap items-start gap-2 sm:justify-end">
					{rightContent || (
						<>
							{/* Botones de acción principales */}
							{mainActions.map(renderActionButton)}

							{/* Menú desplegable de acciones adicionales */}
							{dropdownActions.length > 0 && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm">
											<MoreHorizontal className="h-4 w-4" />
											<span className="sr-only">Más acciones</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										{dropdownActions.map((action) => (
											<DropdownMenuItem
												key={action.label}
												onClick={action.onClick}
												className={cn(
													'cursor-pointer',
													action.variant === 'destructive' &&
														'text-destructive focus:text-destructive hover:text-destructive'
												)}
											>
												{action.icon && <span className="mr-2">{action.icon}</span>}
												{action.label}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</>
					)}
				</div>
			</div>

			{/* Imagen destacada (opcional) */}
			{featuredImage && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="relative w-full h-40 sm:h-60 overflow-hidden rounded-lg"
				>
					<img src={featuredImage} alt={`Imagen destacada de ${title}`} className="w-full h-full object-cover" />
					<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />
				</motion.div>
			)}
		</div>
	);
}
