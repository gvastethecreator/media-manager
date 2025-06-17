/**
 * @file Componente de tarjeta de perfil
 * @module components/entities/profile/ProfileCard
 */

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ProfileExtended } from '@/types/entities/profile';

export interface ProfileCardProps {
	profile: ProfileExtended;
	isSelected?: boolean;
	isExpanded?: boolean;
	onSelect?: (profile: ProfileExtended) => void;
	onExpand?: (profile: ProfileExtended) => void;
	className?: string;
}

/**
 * Componente que muestra una tarjeta con la información de un perfil
 */
export function ProfileCard({
	profile,
	isSelected = false,
	isExpanded = false,
	onSelect,
	onExpand,
	className,
}: ProfileCardProps) {
	const { name, avatarUrl, isActive, theme, language, description, stats } = profile;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			transition={{ duration: 0.2 }}
		>
			<Card
				className={cn(
					'relative overflow-hidden transition-all duration-300',
					isSelected && 'ring-2 ring-primary shadow-lg',
					isExpanded && 'h-auto',
					!isExpanded && 'h-[280px]',
					className
				)}
				onClick={() => onSelect?.(profile)}
			>
				<CardHeader className="space-y-4">
					<div className="flex items-start justify-between">
						<Avatar className="h-16 w-16">
							<AvatarImage src={avatarUrl} alt={name} />
							<AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>
						<Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
					</div>
					<div>
						<CardTitle className="line-clamp-1">{name}</CardTitle>
						<CardDescription className="flex gap-2 mt-1">
							{theme && (
								<Badge variant="outline" className="capitalize">
									{theme}
								</Badge>
							)}
							{language && (
								<Badge variant="outline" className="capitalize">
									{language}
								</Badge>
							)}
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent>
					{description && (
						<p className={cn('text-sm text-muted-foreground', isExpanded ? 'line-clamp-none' : 'line-clamp-2')}>
							{description}
						</p>
					)}

					{stats && (
						<div className="grid grid-cols-3 gap-4 mt-4">
							<div className="text-center">
								<p className="text-2xl font-bold">{stats.images}</p>
								<p className="text-xs text-muted-foreground">Imágenes</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold">{stats.albums}</p>
								<p className="text-xs text-muted-foreground">Álbumes</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold">{stats.collections}</p>
								<p className="text-xs text-muted-foreground">Colecciones</p>
							</div>
						</div>
					)}

					{isExpanded && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="mt-4 pt-4 border-t"
						>
							{/* Contenido expandido */}
							<div className="space-y-2">
								<p className="text-sm">
									<span className="font-medium">Creado:</span> {new Date(profile.createdAt).toLocaleDateString()}
								</p>
								<p className="text-sm">
									<span className="font-medium">Última actualización:</span>{' '}
									{new Date(profile.updatedAt).toLocaleDateString()}
								</p>
								{/* Más detalles del perfil */}
							</div>
						</motion.div>
					)}
				</CardContent>

				{/* Botón para expandir/colapsar */}
				<button
					type="button"
					className="absolute bottom-2 right-2 p-2 rounded-full hover:bg-muted"
					onClick={(e) => {
						e.stopPropagation();
						onExpand?.(profile);
					}}
					title={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
				>
					<motion.svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						animate={{ rotate: isExpanded ? 180 : 0 }}
						aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
						role="img"
					>
						<title>{isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}</title>
						<polyline points="6 9 12 15 18 9" />
					</motion.svg>
				</button>
			</Card>
		</motion.div>
	);
}
