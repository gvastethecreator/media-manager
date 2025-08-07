/**
 * @file Componente de tarjeta de perfil
 * @module components/entities/profile/ProfileCard
 */

import { motion } from 'motion/react';
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
	const { name, imageId, isActive, description, preferences } = profile;

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			initial={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.2 }}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
		>
			<Card
				className={cn(
					'relative overflow-hidden transition-all duration-300',
					isSelected && 'shadow-lg ring-2 ring-primary',
					isExpanded && 'h-auto',
					!isExpanded && 'h-[280px]',
					className
				)}
				onClick={() => onSelect?.(profile)}
			>
				<CardHeader className="space-y-4">
					<div className="flex items-start justify-between">
						<Avatar className="h-16 w-16">
							<AvatarImage alt={name} src={imageId || undefined} />
							<AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>
						<Badge variant={isActive ? 'primary' : 'secondary'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
					</div>
					<div>
						<CardTitle className="line-clamp-1">{name}</CardTitle>
						<CardDescription className="mt-1 flex gap-2">
							{preferences?.theme && (
								<Badge className="capitalize" variant="outline">
									{preferences.theme}
								</Badge>
							)}
							{preferences?.language && (
								<Badge className="capitalize" variant="outline">
									{preferences.language}
								</Badge>
							)}
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent>
					{description && (
						<p className={cn('text-muted-foreground text-sm', isExpanded ? 'line-clamp-none' : 'line-clamp-2')}>
							{description}
						</p>
					)}

					{isExpanded && (
						<motion.div
							animate={{ opacity: 1, height: 'auto' }}
							className="mt-4 border-t pt-4"
							exit={{ opacity: 0, height: 0 }}
							initial={{ opacity: 0, height: 0 }}
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
					className="absolute right-2 bottom-2 rounded-full p-2 hover:bg-muted"
					onClick={(e) => {
						e.stopPropagation();
						onExpand?.(profile);
					}}
					title={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
					type="button"
				>
					<motion.svg
						animate={{ rotate: isExpanded ? 180 : 0 }}
						aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
						fill="none"
						height="20"
						role="img"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						viewBox="0 0 24 24"
						width="20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>{isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}</title>
						<polyline points="6 9 12 15 18 9" />
					</motion.svg>
				</button>
			</Card>
		</motion.div>
	);
}
