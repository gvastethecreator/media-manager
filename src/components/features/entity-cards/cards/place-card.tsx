'use client';

import type { PlaceFormData } from '@/components/features/entity-cards/forms/entity-types';
import { Badge } from '@/components/ui/badge';
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
import { useEffect, useRef } from 'react';

type CardData =
	| (Place & {
			_count?: { images: number };
			totalSize?: number;
			featuredImage?: string | null;
			recentImages?: (string | null)[];
	  })
	| PlaceFormData;

interface PlaceCardProps {
	data: CardData;
	isPreview?: boolean;
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
		case 'fortaleza':
			return <Shield className="h-4 w-4" />;
		case 'ruinas':
			return <Scroll className="h-4 w-4" />;
		case 'mazmorra':
			return <Skull className="h-4 w-4" />;
		default:
			return <MapPin className="h-4 w-4" />;
	}
};

function getRandomGradient() {
	const gradients = [
		'from-green-500/20 to-emerald-500/20',
		'from-blue-500/20 to-cyan-500/20',
		'from-yellow-500/20 to-amber-500/20',
		'from-indigo-500/20 to-violet-500/20',
		'from-red-500/20 to-pink-500/20',
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

export function PlaceCard({ data, isPreview = false, onEdit, onDelete, onClick, className }: PlaceCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	const gradient = getRandomGradient();

	// Para modo preview, detectar cambios
	const prevDataRef = useRef<CardData | null>(null);

	// Para modo preview, animar cambios
	useEffect(() => {
		if (!isPreview) {
			return;
		}

		if (!prevDataRef.current) {
			prevDataRef.current = { ...data };
			return;
		}

		prevDataRef.current = { ...data };
	}, [data, isPreview]);

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

	// Renderizar versión para preview en diálogos
	if (isPreview) {
		return (
			<motion.div
				className={cn(
					'group relative flex h-52 flex-col overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 hover:border-primary',
					isHovered && 'shadow-lg',
					className
				)}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				onMouseMove={handleMouseMove}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* Gradiente de fondo */}
				<div
					className={cn(
						'absolute inset-0 z-0 bg-gradient-to-br opacity-50 transition-opacity duration-300',
						gradient,
						isHovered && 'opacity-80'
					)}
					style={{
						backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
					}}
				/>

				{/* Contenido */}
				<div className="z-10 flex flex-1 flex-col">
					<div className="flex items-center space-x-2">
						<div
							className="flex h-10 w-10 items-center justify-center rounded-full"
							style={{ backgroundColor: data.color }}
						>
							<MapPin className="h-5 w-5 text-white" />
						</div>
						<div>
							<h3 className="text-xl font-semibold line-clamp-1">{data.name || 'Sin nombre'}</h3>
							{data && 'category' in data && data.category && (
								<p className="text-sm text-muted-foreground">{data.category}</p>
							)}
						</div>
						{data && 'climate' in data && data.climate && (
							<Badge variant="outline" className="ml-auto">
								{data.climate}
							</Badge>
						)}
					</div>

					{/* Descripción */}
					{data.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{data.description}</p>}

					{/* Atributos */}
					<div className="mt-4 grid grid-cols-2 gap-2">
						{data && 'climate' in data && data.climate && (
							<div className="flex items-center space-x-2">
								<span className="text-xs font-medium text-muted-foreground">Clima:</span>
								<span className="text-xs">{data.climate}</span>
							</div>
						)}
						{data && 'government' in data && data.government && (
							<div className="flex items-center space-x-2">
								<span className="text-xs font-medium text-muted-foreground">Gobierno:</span>
								<span className="text-xs line-clamp-1">{data.government}</span>
							</div>
						)}
					</div>

					{/* Detalles */}
					<div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center space-x-2">
							<span className="inline-flex items-center rounded-full border px-2 py-0.5">{data.emoji || '🗺️'}</span>
						</div>
						<div className="flex items-center space-x-2">
							<span className="flex items-center">Lugar</span>
						</div>
					</div>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			className={cn(
				'group h-[420px] rounded-lg overflow-hidden relative shadow-md hover:shadow-lg',
				'transition-shadow duration-300',
				className
			)}
			onClick={onClick}
			whileHover={{ y: -5 }}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Fondo con gradiente */}
			<div
				className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/40"
				style={{
					backgroundSize: '400% 400%',
					animation: isHovered ? 'gradient 8s ease infinite' : 'none',
				}}
			/>

			{/* Patrones de decoración */}
			<div
				className="absolute inset-0 opacity-5"
				style={{
					backgroundImage: `
            radial-gradient(
              circle at 10% 10%,
              ${data?.color || '#22c55e'}22,
              transparent 40%
            ),
            radial-gradient(
              circle at 90% 90%,
              ${data?.color || '#22c55e'}22,
              transparent 40%
            )
          `,
				}}
			/>

			<div className="relative h-full p-5 flex flex-col">
				{/* Cabecera */}
				<div className="flex items-center mb-3">
					<div
						className="h-12 w-12 rounded-lg flex items-center justify-center"
						style={{
							backgroundColor: data?.color || '#22c55e',
							boxShadow: `0 0 10px ${data?.color || '#22c55e'}44`,
						}}
					>
						<span className="text-2xl text-white">{data?.emoji || '🗺️'}</span>
					</div>
					<div className="ml-3 flex-1">
						<h3 className="text-xl font-bold">{data?.name || 'Sin nombre'}</h3>
						{data && 'category' in data && data.category && (
							<div className="flex items-center text-sm text-muted-foreground">
								<MapPin className="h-3.5 w-3.5 mr-1" />
								<span>{data.category}</span>
							</div>
						)}
					</div>
				</div>

				{/* Características principales */}
				<div className="grid grid-cols-2 gap-2 mb-4">
					{data && 'climate' in data && data.climate && (
						<div className="flex items-center space-x-1 text-sm">
							{getClimateIcon(data.climate)}
							<span className="text-muted-foreground">{data.climate}</span>
						</div>
					)}
					{data && 'type' in data && data.type && (
						<div className="flex items-center space-x-1 text-sm ml-4">
							{getTypeIcon(data.type)}
							<span className="text-muted-foreground">{data.type}</span>
						</div>
					)}
				</div>

				{/* Descripción */}
				{data.description && (
					<div className="mb-4 bg-background/60 backdrop-blur-sm rounded-md p-3">
						<p className="text-sm line-clamp-3">{data.description}</p>
					</div>
				)}

				{/* Gobierno y población (si existen) */}
				{data && 'government' in data && data.government && (
					<div className="mb-3 flex items-center text-sm">
						<Users className="h-4 w-4 mr-2 text-muted-foreground" />
						<span>Gobierno: {data.government}</span>
					</div>
				)}
				{data && 'population' in data && data.population && data.population > 0 && (
					<div className="mb-3 flex items-center text-sm">
						<Users className="h-4 w-4 mr-2 text-muted-foreground" />
						<span>Población: {data.population.toLocaleString()}</span>
					</div>
				)}

				{/* Estadísticas */}
				<div className="mt-auto">
					{data && '_count' in data && data._count && (
						<div className="text-xs text-muted-foreground mt-1">
							<Badge variant="outline">{`${data._count.images || 0} imágenes`}</Badge>
						</div>
					)}

					{data && 'totalSize' in data && data.totalSize && (
						<div className="text-xs text-muted-foreground mt-1">
							<Badge variant="outline">{`${formatBytes(data.totalSize)}`}</Badge>
						</div>
					)}

					{data && 'recentImages' in data && data.recentImages && data.recentImages.length > 0 && (
						<div className="grid grid-cols-3 gap-1 mb-2">
							{data.recentImages.slice(0, 3).map((img, i) => (
								<div
									key={`place-img-${data.id}-${i}-${Date.now()}`}
									className="relative aspect-square rounded-md overflow-hidden bg-muted"
								>
									{img ? (
										<img src={img} alt="" className="object-cover w-full h-full" />
									) : (
										<MapPin className="h-4 w-4 absolute inset-0 m-auto text-muted-foreground" />
									)}
								</div>
							))}
						</div>
					)}
				</div>

				{/* Acciones */}
				<div
					className={cn(
						'absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200',
						isHovered && 'opacity-100'
					)}
				>
					{onEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-background/80 backdrop-blur-xs"
							onClick={() => {
								onEdit(data as Place);
							}}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-background/80 backdrop-blur-xs text-destructive"
							onClick={() => {
								if (data.id) {
									onDelete(data.id);
								}
							}}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</motion.div>
	);
}
