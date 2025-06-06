'use client';

import type { GroupWithStats } from '@/app/actions/groups/group.actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Group as GroupIcon, Heart, Image as ImageIcon, Tags, Users, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo } from 'react';

interface GroupCardProps {
	/** 📊 Grupo con estadísticas para mostrar */
	group: GroupWithStats;
	/** 🎯 Función que se ejecuta al hacer clic en la tarjeta */
	onClick?: () => void;
	/** 🎨 Clases CSS adicionales */
	className?: string;
	/** 📱 Mostrar badges con información adicional */
	showBadges?: boolean;
}

/**
 * 🏷️ Card para mostrar un grupo con diseño moderno
 *
 * Muestra información del grupo incluyendo:
 * - Nombre y emoji del grupo
 * - Descripción y categoría
 * - Estadísticas de elementos
 * - Color personalizado
 * - Estado de favorito
 *
 * @example
 * ```tsx
 * <GroupCard
 *   group={groupData}
 *   onClick={() => console.log('Grupo seleccionado')}
 *   showBadges={true}
 * />
 * ```
 */
export function GroupCard({ group, onClick, className, showBadges = true }: GroupCardProps) {
	// 🎨 Calcular colores basados en el color del grupo
	const primaryColor = useMemo(() => group.color || '#3b82f6', [group.color]);
	const secondaryColor = useMemo(() => {
		if (!group.color) return '#2563eb';

		try {
			// Convertir hex a RGB y oscurecer
			const r = Number.parseInt(group.color.slice(1, 3), 16);
			const g = Number.parseInt(group.color.slice(3, 5), 16);
			const b = Number.parseInt(group.color.slice(5, 7), 16);

			const darkenFactor = 0.8;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (e) {
			return '#2563eb';
		}
	}, [group.color]);

	// 📊 Calcular estadísticas totales
	const totalElements = useMemo(() => {
		return (group._count?.images || 0) +
			(group._count?.videos || 0) +
			(group._count?.albums || 0) +
			(group._count?.collections || 0) +
			(group._count?.tags || 0);
	}, [group._count]);

	// 📱 Manejador de eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick]
	);

	// 🎯 Manejador de clic
	const handleClick = useCallback(() => {
		if (onClick) {
			onClick();
		}
	}, [onClick]);

	// 📅 Formatear fecha para mostrar
	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<Card
			className={cn(
				'flex flex-col h-full overflow-hidden transition-all duration-300',
				'hover:shadow-lg cursor-pointer border-2 relative',
				onClick && 'focus:outline-none focus:ring-2 focus:ring-offset-2',
				className
			)}
			style={{
				borderColor: `${primaryColor}80`,
				background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05)`,
			}}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'article'}
			data-group-id={group.id}
		>
			{/* ✨ Efecto de brillo en la esquina */}
			<div className="absolute top-0 right-0 w-16 h-16 opacity-30 pointer-events-none">
				<div
					className="w-full h-full"
					style={{
						background: `radial-gradient(circle at 100% 0%, ${primaryColor}40, transparent 60%)`
					}}
				/>
			</div>

			{/* 🎯 Cabecera con emoji y nombre */}
			<CardHeader className="pb-3 relative z-10">
				<div className="flex items-center gap-3">
					{/* 😀 Emoji del grupo */}
					<div
						className="flex items-center justify-center w-12 h-12 rounded-full text-white text-xl"
						style={{ backgroundColor: primaryColor }}
					>
						{group.emoji || <GroupIcon size={20} />}
					</div>

					{/* 📝 Información del grupo */}
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-lg leading-tight truncate">
							{group.name}
						</h3>
						{group.category && (
							<p className="text-sm text-muted-foreground truncate">
								{group.category}
							</p>
						)}
					</div>

					{/* ⭐ Indicador de favorito */}
					{group.isFavorite && (
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							className="text-yellow-500"
						>
							<Heart className="w-5 h-5 fill-current" />
						</motion.div>
					)}
				</div>
			</CardHeader>

			{/* 📄 Contenido principal */}
			<CardContent className="flex-1 pb-3">
				{/* 📝 Descripción */}
				{group.description && (
					<p className="text-sm text-muted-foreground line-clamp-3 mb-3">
						{group.description}
					</p>
				)}

				{/* 📊 Estadísticas visuales */}
				<div className="grid grid-cols-2 gap-2 mb-3">
					{/* 🖼️ Imágenes */}
					{(group._count?.images || 0) > 0 && (
						<div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
							<ImageIcon className="w-4 h-4" style={{ color: primaryColor }} />
							<span className="text-sm font-medium">{group._count.images}</span>
						</div>
					)}

					{/* 🎬 Videos */}
					{(group._count?.videos || 0) > 0 && (
						<div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
							<Video className="w-4 h-4" style={{ color: primaryColor }} />
							<span className="text-sm font-medium">{group._count.videos}</span>
						</div>
					)}

					{/* 🏷️ Tags */}
					{(group._count?.tags || 0) > 0 && (
						<div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
							<Tags className="w-4 h-4" style={{ color: primaryColor }} />
							<span className="text-sm font-medium">{group._count.tags}</span>
						</div>
					)}

					{/* 👥 Total elementos */}
					{totalElements > 0 && (
						<div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
							<Users className="w-4 h-4" style={{ color: primaryColor }} />
							<span className="text-sm font-medium">{totalElements}</span>
						</div>
					)}
				</div>
			</CardContent>

			{/* 🦶 Pie con badges y fecha */}
			<CardFooter className="pt-0">
				{showBadges && (
					<div className="flex flex-wrap gap-1 w-full">
						{/* 📁 Badge de categoría */}
						{group.category && group.category !== 'General' && (
							<Badge
								variant="outline"
								className="text-xs"
								style={{ borderColor: `${primaryColor}50` }}
							>
								{group.category}
							</Badge>
						)}

						{/* 📊 Badge de total elementos */}
						{totalElements > 0 && (
							<Badge
								variant="outline"
								className="text-xs"
								style={{ borderColor: `${primaryColor}50` }}
							>
								{totalElements} elementos
							</Badge>
						)}

						{/* 📅 Fecha de actualización */}
						<Badge variant="outline" className="text-xs ml-auto">
							{formatDate(group.updatedAt)}
						</Badge>
					</div>
				)}
			</CardFooter>
		</Card>
	);
}

/**
 * 🚀 Versión memoizada del componente para mejor rendimiento
 */
export const MemoizedGroupCard = motion(GroupCard);
