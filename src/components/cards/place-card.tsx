'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';
import type { Place } from '@prisma/client';
import {
	Building2,
	Clock,
	Cloud,
	Compass,
	Globe,
	Image as ImageIcon,
	MapPin,
	Mountain,
	PencilIcon,
	Scroll,
	Shield,
	Skull,
	Sword,
	Trash2,
	TreePine,
	Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';

interface PlaceCardProps {
	place: Place & {
		_count?: { images: number };
		totalSize?: number;
		featuredImage?: string | null;
		recentImages?: (string | null)[];
	};
	onEdit?: (place: Place) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
}

const getClimateIcon = (climate: string) => {
	switch (climate.toLowerCase()) {
		case 'tropical':
			return <TreePine className="h-4 w-4" />;
		case 'árido':
			return <Mountain className="h-4 w-4" />;
		case 'templado':
			return <Cloud className="h-4 w-4" />;
		case 'polar':
			return <Compass className="h-4 w-4" />;
		default:
			return <Globe className="h-4 w-4" />;
	}
};

const getTypeIcon = (type: string) => {
	switch (type.toLowerCase()) {
		case 'ciudad':
			return <Building2 className="h-4 w-4" />;
		case 'castillo':
			return <Shield className="h-4 w-4" />;
		case 'ruinas':
			return <Mountain className="h-4 w-4" />;
		case 'mazmorra':
			return <Sword className="h-4 w-4" />;
		default:
			return <MapPin className="h-4 w-4" />;
	}
};

export function PlaceCard({ place, onEdit, onDelete, onClick, className }: PlaceCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	const cardRef = React.useRef<HTMLDivElement>(null);

	// Manejar el movimiento del mouse para efectos de iluminación
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!cardRef.current) {
			return;
		}
		const rect = cardRef.current.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

	// Parsear los peligros y recursos
	const dangers = React.useMemo(() => {
		try {
			return JSON.parse(place.dangers);
		} catch {
			return [];
		}
	}, [place.dangers]);

	const resources = React.useMemo(() => {
		try {
			return JSON.parse(place.resources);
		} catch {
			return [];
		}
	}, [place.resources]);

	const typeIcon = React.useMemo(() => getTypeIcon(place.type), [place.type]);
	const climateIcon = React.useMemo(() => getClimateIcon(place.climate), [place.climate]);

	return (
		<motion.div
			ref={cardRef}
			className={cn(
				'relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden',
				'bg-linear-to-br from-zinc-950 to-stone-900',
				'shadow-lg hover:shadow-xl transition-all duration-300',
				'cursor-pointer perspective-1000',
				className
			)}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			onMouseMove={handleMouseMove}
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.2 }}
			onClick={onClick}
			style={
				{
					'--x': `${mousePosition.x}%`,
					'--y': `${mousePosition.y}%`,
				} as React.CSSProperties
			}
		>
			{/* Imagen destacada con efecto de mapa antiguo */}
			{place.featuredImage && (
				<div className="absolute inset-0 z-0">
					<div
						className="absolute inset-0 bg-cover bg-center"
						style={{
							backgroundImage: `url(${place.featuredImage})`,
							opacity: 0.15,
							filter: 'sepia(1) brightness(0.8) contrast(1.2)',
							mixBlendMode: 'overlay',
						}}
					/>
					<div className="absolute inset-x-0 top-20 bottom-40 px-4">
						<div className="relative w-full h-full rounded-lg overflow-hidden">
							<img
								src={place.featuredImage}
								alt={place.name}
								className="object-cover w-full h-full sepia brightness-90 contrast-110"
							/>
							<div
								className="absolute inset-0"
								style={{
									background: `linear-gradient(to bottom,
										transparent 0%,
										${place.color}22 50%,
										${place.color}44 100%
									)`,
									mixBlendMode: 'overlay',
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Textura de papel antiguo */}
			<div
				className="absolute inset-0 opacity-20 mix-blend-overlay"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
					filter: 'sepia(1) invert(1)',
				}}
			/>

			{/* Patrón de coordenadas */}
			<div
				className="absolute inset-0 opacity-5"
				style={{
					backgroundImage: `linear-gradient(0deg, ${place.color}22 1px, transparent 1px),
						linear-gradient(90deg, ${place.color}22 1px, transparent 1px)`,
					backgroundSize: '20px 20px',
					mixBlendMode: 'overlay',
				}}
			/>

			{/* Marco decorativo con brújula */}
			<div
				className="absolute inset-[2px] rounded-lg border-2"
				style={{
					borderImage: `linear-gradient(
						to bottom right,
						${place.color}88,
						transparent,
						${place.color}88
					) 1`,
					boxShadow: `inset 0 0 20px ${place.color}11`,
				}}
			>
				{/* Brújula */}
				<div
					className="absolute -top-1 -right-1 h-12 w-12 opacity-20"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='24' cy='24' r='20' stroke='${encodeURIComponent(
							place.color
						)}' stroke-width='2'/%3E%3Cpath d='M24 4L26 22L44 24L26 26L24 44L22 26L4 24L22 22L24 4Z' fill='${encodeURIComponent(
							place.color
						)}'/%3E%3C/svg%3E")`,
						backgroundSize: 'contain',
						transform: 'rotate(45deg)',
						filter: 'sepia(1) invert(1)',
					}}
				/>
			</div>

			{/* Grid de imágenes recientes */}
			{place.recentImages && place.recentImages.length > 0 && (
				<div className="absolute inset-x-0 bottom-20 h-32 px-4 z-0">
					<div className="grid grid-cols-3 gap-2 h-full">
						{place.recentImages.slice(0, 3).map((src, i) => (
							<div
								key={`${place.id}-image-${i}-${src?.substring(0, 10) || 'empty'}`}
								className="relative rounded-md overflow-hidden aspect-square"
							>
								{src ? (
									<img
										src={src}
										alt={`Imagen ${i + 1}`}
										className="object-cover w-full h-full sepia brightness-90 contrast-110"
									/>
								) : (
									<div
										className={cn(
											'w-full h-full flex items-center justify-center',
											'bg-linear-to-br from-zinc-900 to-stone-800'
										)}
									>
										<ImageIcon className="w-4 h-4 text-white/80" />
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Contenido de la carta */}
			<div className="relative h-full p-4 flex flex-col">
				{/* Encabezado */}
				<div className="flex items-center gap-3 mb-4">
					<div
						className={cn(
							'h-12 w-12 rounded-lg flex items-center justify-center',
							'bg-linear-to-br shadow-inner',
							'from-zinc-900 to-stone-800'
						)}
						style={{
							border: `2px solid ${place.color}88`,
							boxShadow: `inset 0 2px 4px ${place.color}22`,
						}}
					>
						<span className="text-2xl filter drop-shadow-sm">{place.emoji}</span>
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-lg leading-tight truncate text-zinc-100">{place.name}</h3>
						<div className="flex items-center gap-2 text-sm text-zinc-400">
							<div className="flex items-center gap-1">
								{React.cloneElement(typeIcon, {
									className: 'h-3 w-3',
									style: { color: place.color },
								})}
								<span className="text-xs">{place.type}</span>
							</div>
							<span className="mx-1">•</span>
							<div className="flex items-center gap-1">
								{React.cloneElement(climateIcon, {
									className: 'h-3 w-3',
									style: { color: place.color },
								})}
								<span className="text-xs">{place.climate}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Descripción */}
				{place.description && (
					<div className="mb-4">
						<p className="text-sm text-zinc-400 line-clamp-2">{place.description}</p>
					</div>
				)}

				{/* Población y gobierno */}
				<div className="mb-4">
					<div className="flex items-center gap-4 text-xs text-zinc-400">
						<div className="flex items-center gap-1">
							<Users className="h-3 w-3" style={{ color: place.color }} />
							<span>Población: {place.population.toLocaleString()}</span>
						</div>
						{place.government && (
							<div className="flex items-center gap-1">
								<Shield className="h-3 w-3" style={{ color: place.color }} />
								<span>{place.government}</span>
							</div>
						)}
					</div>
				</div>

				{/* Peligros y recursos en columnas */}
				<div className="grid grid-cols-2 gap-4 mb-4">
					{dangers.length > 0 && (
						<div className="bg-zinc-900/50 rounded-lg p-2">
							<div className="flex items-center gap-2 mb-1">
								<Skull className="h-3 w-3" style={{ color: place.color }} />
								<span className="text-xs font-medium text-zinc-300">Peligros</span>
							</div>
							<ul className="text-xs text-zinc-400 space-y-1">
								{dangers.slice(0, 3).map((danger: string, index: number) => (
									<li
										key={`${place.id}-danger-${index}-${danger.substring(0, 10)}`}
										className="flex items-center gap-2"
									>
										<span className="w-1 h-1 rounded-full" style={{ backgroundColor: place.color }} />
										{danger}
									</li>
								))}
								{dangers.length > 3 && <li className="text-xs text-zinc-500">+{dangers.length - 3} más...</li>}
							</ul>
						</div>
					)}

					{resources.length > 0 && (
						<div className="bg-zinc-900/50 rounded-lg p-2">
							<div className="flex items-center gap-2 mb-1">
								<TreePine className="h-3 w-3" style={{ color: place.color }} />
								<span className="text-xs font-medium text-zinc-300">Recursos</span>
							</div>
							<ul className="text-xs text-zinc-400 space-y-1">
								{resources.slice(0, 3).map((resource: string, index: number) => (
									<li
										key={`${place.id}-resource-${index}-${resource.substring(0, 10)}`}
										className="flex items-center gap-2"
									>
										<span className="w-1 h-1 rounded-full" style={{ backgroundColor: place.color }} />
										{resource}
									</li>
								))}
								{resources.length > 3 && <li className="text-xs text-zinc-500">+{resources.length - 3} más...</li>}
							</ul>
						</div>
					)}
				</div>

				{/* Historia */}
				{place.lore && (
					<div className="mt-auto bg-zinc-900/50 rounded-lg p-2">
						<div className="flex items-center gap-2 mb-1">
							<Scroll className="h-3 w-3" style={{ color: place.color }} />
							<span className="text-xs font-medium text-zinc-300">Historia</span>
						</div>
						<p className="text-xs text-zinc-400 line-clamp-3">{place.lore}</p>
					</div>
				)}

				{/* Contador de imágenes */}
				{place._count?.images !== undefined && (
					<div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
						<ImageIcon className="h-3 w-3" />
						<span>
							{place._count.images} {place._count.images === 1 ? 'imagen' : 'imágenes'}
						</span>
						{place.totalSize && (
							<>
								<span className="mx-1">•</span>
								<span>{formatBytes(place.totalSize)}</span>
							</>
						)}
					</div>
				)}

				{/* Acciones */}
				<motion.div
					className="absolute top-2 right-2 flex gap-1"
					initial={{ opacity: 0 }}
					animate={{ opacity: isHovered ? 1 : 0 }}
				>
					{onEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-zinc-950/80 backdrop-blur-xs hover:bg-zinc-900/80"
							onClick={() => onEdit(place)}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-zinc-950/80 backdrop-blur-xs hover:bg-zinc-900/80 text-destructive"
							onClick={() => onDelete(place.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</motion.div>
			</div>
		</motion.div>
	);
}
