/**
 * @file Tarjeta dinámica de entidad que muestra solo campos con valor
 * @module components/ui/entity-card-dynamic
 * @description Componente de tarjeta que adapta su visualización según
 *              qué campos de la entidad tienen datos
 */

import React from 'react';
import { Heart, Star, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils/styles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EntityCardField {
	/** Clave del campo */
	key: string;
	/** Etiqueta visible */
	label: string;
	/** Valor del campo */
	value: any;
	/** Tipo de renderizado */
	type?: 'text' | 'badge' | 'list' | 'long-text';
}

interface EntityCardProps {
	/** ID de la entidad */
	id: string;
	/** Nombre de la entidad */
	name: string;
	/** Emoji representativo */
	emoji?: string | null;
	/** Color de la entidad */
	color?: string | null;
	/** Descripción breve */
	description?: string | null;
	/** Si es favorito */
	isFavorite?: boolean;
	/** Imagen destacada (URL) */
	featuredImage?: string | null;
	/** Campos adicionales con valores */
	fields?: EntityCardField[];
	/** Estadísticas (conteos) */
	stats?: {
		images?: number;
		videos?: number;
		[key: string]: number | undefined;
	};
	/** Callback al hacer click */
	onClick?: () => void;
	/** Callback al marcar/desmarcar favorito */
	onToggleFavorite?: () => void;
	/** Acciones del menú contextual */
	actions?: Array<{
		label: string;
		icon?: React.ReactNode;
		onClick: () => void;
		variant?: 'default' | 'destructive';
	}>;
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Renderiza un campo según su tipo
 */
function renderFieldValue(field: EntityCardField) {
	// No mostrar si no hay valor
	if (
		field.value === null ||
		field.value === undefined ||
		field.value === '' ||
		(Array.isArray(field.value) && field.value.length === 0)
	) {
		return null;
	}

	switch (field.type) {
		case 'badge':
			return <Badge variant="secondary">{field.value}</Badge>;

		case 'list':
			if (Array.isArray(field.value)) {
				return (
					<div className="flex flex-wrap gap-1">
						{field.value.map((item, idx) => (
							<Badge key={idx} variant="outline" className="text-xs">
								{item}
							</Badge>
						))}
					</div>
				);
			}
			return <span className="text-sm text-gray-600 dark:text-gray-400">{field.value}</span>;

		case 'long-text':
			return (
				<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap">{field.value}</p>
			);

		case 'text':
		default:
			return <span className="text-sm text-gray-900 dark:text-gray-100">{field.value}</span>;
	}
}

/**
 * Tarjeta de entidad con campos condicionales
 */
export function EntityCardDynamic({
	id,
	name,
	emoji,
	color,
	description,
	isFavorite,
	featuredImage,
	fields = [],
	stats,
	onClick,
	onToggleFavorite,
	actions = [],
	className,
}: EntityCardProps) {
	// Filtrar campos que tienen valor
	const visibleFields = fields.filter(
		(f) =>
			f.value !== null &&
			f.value !== undefined &&
			f.value !== '' &&
			!(Array.isArray(f.value) && f.value.length === 0)
	);

	// Calcular estadísticas visibles
	const visibleStats = stats
		? Object.entries(stats)
				.filter(([_, count]) => count && count > 0)
				.map(([key, count]) => ({
					key,
					label: key.charAt(0).toUpperCase() + key.slice(1),
					count,
				}))
		: [];

	return (
		<div
			className={cn(
				'group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
				'shadow-sm hover:shadow-md transition-all duration-200',
				'overflow-hidden',
				onClick && 'cursor-pointer hover:border-primary/50',
				className
			)}
			onClick={onClick}
			onKeyDown={(e) => {
				if (onClick && (e.key === 'Enter' || e.key === ' ')) {
					e.preventDefault();
					onClick();
				}
			}}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
		>
			{/* Imagen destacada */}
			{featuredImage && (
				<div className="relative w-full h-32 bg-gray-100 dark:bg-gray-900">
					<img src={featuredImage} alt={name} className="w-full h-full object-cover" />
					<div
						className="absolute inset-0"
						style={{
							background: `linear-gradient(to bottom, transparent 0%, ${color || '#000'}40 100%)`,
						}}
					/>
				</div>
			)}

			{/* Header con emoji, nombre y acciones */}
			<div className="p-4 space-y-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						{emoji && <span className="text-2xl flex-shrink-0">{emoji}</span>}
						<div className="flex-1 min-w-0">
							<h3
								className="font-semibold text-lg truncate"
								style={{ color: color || undefined }}
								title={name}
							>
								{name}
							</h3>
						</div>
					</div>

					{/* Acciones */}
					<div className="flex items-center gap-1 flex-shrink-0">
						{onToggleFavorite && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={(e) => {
									e.stopPropagation();
									onToggleFavorite();
								}}
								aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
							>
								<Heart
									className={cn('h-4 w-4', isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400')}
								/>
							</Button>
						)}

						{actions.length > 0 && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{actions.map((action, idx) => (
										<DropdownMenuItem
											key={idx}
											onClick={(e) => {
												e.stopPropagation();
												action.onClick();
											}}
											className={
												action.variant === 'destructive'
													? 'text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400'
													: undefined
											}
										>
											{action.icon && <span className="mr-2">{action.icon}</span>}
											{action.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>

				{/* Descripción */}
				{description && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{description}</p>}

				{/* Campos dinámicos */}
				{visibleFields.length > 0 && (
					<div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
						{visibleFields.map((field) => (
							<div key={field.key} className="flex flex-col gap-1">
								<span className="text-xs font-medium text-gray-500 dark:text-gray-400">{field.label}</span>
								{renderFieldValue(field)}
							</div>
						))}
					</div>
				)}

				{/* Estadísticas */}
				{visibleStats.length > 0 && (
					<div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
						{visibleStats.map((stat) => (
							<Badge key={stat.key} variant="outline" className="text-xs">
								{stat.label}: {stat.count}
							</Badge>
						))}
					</div>
				)}
			</div>

			{/* Indicador de favorito (esquina) */}
			{isFavorite && !onToggleFavorite && (
				<div className="absolute top-2 right-2">
					<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
				</div>
			)}
		</div>
	);
}
