'use client';

import type { WorldItemFormData } from '@/components/features/entity-cards/entity-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { formatBytes, formatDate } from '@/lib/utils/utils';
import type { WorldItem as PrismaWorldItem } from '@prisma/client';
import {
	Box,
	Clock,
	Cog,
	Crown,
	Gauge,
	Gem,
	Image as ImageIcon,
	PencilIcon,
	Scroll,
	ScrollText,
	Shield,
	Sparkles,
	Swords,
	Target,
	Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useRef } from 'react';

type CardData =
	| (PrismaWorldItem & {
			_count?: { images: number };
			totalSize?: number;
			featuredImage?: string | null;
			recentImages?: (string | null)[];
	  })
	| WorldItemFormData;

interface WorldItemCardProps {
	worldItem: CardData;
	isPreview?: boolean;
	onEdit?: (worldItem: PrismaWorldItem) => void;
	onDelete?: (id: string) => void;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
}

const getRarityGradient = (rarity: string) => {
	const gradients = {
		Común: 'from-zinc-500/20 via-slate-400/20 to-zinc-500/20',
		Poco_común: 'from-emerald-500/20 via-green-400/20 to-emerald-500/20',
		Raro: 'from-blue-500/20 via-indigo-400/20 to-blue-500/20',
		Muy_raro: 'from-violet-500/20 via-purple-400/20 to-violet-500/20',
		Legendario: 'from-amber-500/20 via-yellow-400/20 to-amber-500/20',
		Mítico: 'from-rose-500/20 via-red-400/20 to-rose-500/20',
		default: 'from-zinc-500/20 via-slate-400/20 to-zinc-500/20',
	};
	return gradients[rarity.replace(' ', '_') as keyof typeof gradients] || gradients.default;
};

const getTypeIcon = (type: string) => {
	switch (type.toLowerCase()) {
		case 'arma':
			return <Swords className="h-4 w-4" />;
		case 'armadura':
			return <Shield className="h-4 w-4" />;
		case 'accesorio':
			return <Crown className="h-4 w-4" />;
		case 'consumible':
			return <Scroll className="h-4 w-4" />;
		case 'herramienta':
			return <Cog className="h-4 w-4" />;
		case 'gema':
			return <Gem className="h-4 w-4" />;
		case 'reliquia':
			return <Sparkles className="h-4 w-4" />;
		default:
			return <Box className="h-4 w-4" />;
	}
};

function getRandomGradient() {
	const gradients = [
		'from-orange-500/20 to-amber-500/20',
		'from-purple-500/20 to-indigo-500/20',
		'from-teal-500/20 to-green-500/20',
		'from-rose-500/20 to-red-500/20',
		'from-blue-500/20 to-sky-500/20',
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

export function WorldItemCard({
	worldItem: data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
}: WorldItemCardProps) {
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
						<span className="text-2xl">{data.emoji || '🧩'}</span>
						<h3 className="text-xl font-semibold line-clamp-1">{data.name || 'Sin nombre'}</h3>
						{'category' in data && data.category && (
							<Badge variant="outline" className="ml-auto">
								{data.category}
							</Badge>
						)}
					</div>

					{/* Campos destacados */}
					<div className="mt-2 space-y-1">
						{data.description && <p className="text-sm text-muted-foreground line-clamp-3">{data.description}</p>}

						{'origin' in data && data.origin && (
							<div className="flex items-center mt-2">
								<span className="text-xs font-medium text-muted-foreground mr-2">Origen:</span>
								<span className="text-xs">{data.origin}</span>
							</div>
						)}

						{'materials' in data && typeof data.materials === 'string' && (
							<div className="flex items-center">
								<span className="text-xs font-medium text-muted-foreground mr-2">Materiales:</span>
								<span className="text-xs">{data.materials}</span>
							</div>
						)}
					</div>

					{/* Detalles */}
					<div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center space-x-2">
							<span className="flex items-center">
								<div className="mr-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color || '#f97316' }} />
								Vista previa
							</span>
						</div>
						<div className="flex items-center space-x-2">
							<Box className="h-3.5 w-3.5 mr-1" />
							<span>Objeto del mundo</span>
						</div>
					</div>
				</div>
			</motion.div>
		);
	}

	// Para la tarjeta regular, necesitamos acceder a propiedades específicas
	let rarityGradient = 'from-zinc-500/20 via-slate-400/20 to-zinc-500/20';
	let typeIcon = <Box className="h-4 w-4" />;

	if ('rarity' in data && data.rarity) {
		rarityGradient = getRarityGradient(data.rarity);
	}

	if ('type' in data && data.type) {
		typeIcon = getTypeIcon(data.type);
	}

	return (
		<motion.div
			className={cn(
				'relative h-[500px] w-full rounded-lg shadow-md hover:shadow-lg overflow-hidden bg-card',
				className
			)}
			whileHover={{ y: -5 }}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Fondo con gradiente */}
			<div
				className={cn(
					'absolute inset-0 bg-gradient-to-br z-0 opacity-40',
					'rarity' in data && data.rarity ? rarityGradient : 'from-orange-500/20 to-amber-500/20'
				)}
			/>

			{/* Overlay de hover */}
			<div
				className={cn(
					'absolute inset-0 bg-gradient-to-t from-background to-transparent transition-opacity duration-300 z-0',
					isHovered ? 'opacity-60' : 'opacity-40'
				)}
			/>

			{/* Contenido */}
			<div className="relative h-full p-5 flex flex-col z-10">
				{/* Encabezado */}
				<div className="flex items-start gap-3 mb-4">
					<div
						className="flex flex-shrink-0 h-12 w-12 rounded-lg items-center justify-center shadow-md"
						style={{ backgroundColor: data.color || '#f97316' }}
					>
						<span className="text-2xl text-white">{data.emoji}</span>
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="text-xl font-bold leading-tight truncate">{data.name}</h3>
						{'type' in data && data.type && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								{typeIcon}
								<span className="truncate">{data.type}</span>
							</div>
						)}
					</div>
					<div className="flex flex-col gap-2">
						{'rarity' in data && data.rarity && (
							<Badge
								variant="outline"
								className={cn(
									'px-2 py-1',
									data.rarity.toLowerCase().includes('legend') && 'bg-amber-100/20 text-amber-600 dark:text-amber-400',
									data.rarity.toLowerCase().includes('mítico') && 'bg-rose-100/20 text-rose-600 dark:text-rose-400',
									data.rarity.toLowerCase().includes('raro') && 'bg-blue-100/20 text-blue-600 dark:text-blue-400'
								)}
							>
								{data.rarity}
							</Badge>
						)}
						{'_count' in data && (
							<div className="flex items-center text-xs text-muted-foreground">
								<ImageIcon className="h-3.5 w-3.5 mr-1" />
								<span>{data._count?.images || 0}</span>
							</div>
						)}
					</div>
				</div>

				{/* Descripción */}
				{data.description && (
					<div className="mb-4">
						<p className="text-sm text-muted-foreground line-clamp-3">{data.description}</p>
					</div>
				)}

				{/* Propiedades */}
				{'properties' in data && data.properties && (
					<div className="mb-4">
						<h4 className="text-sm font-semibold mb-2 flex items-center">
							<Sparkles className="h-4 w-4 mr-2" />
							Propiedades
						</h4>
						<div className="flex flex-wrap gap-2">
							{(typeof data.properties === 'string' ? JSON.parse(data.properties) : data.properties)
								.slice(0, 4)
								.map((prop: string) => (
									<Badge key={`prop-${prop}`} variant="secondary" className="text-xs">
										{prop}
									</Badge>
								))}
							{(typeof data.properties === 'string' ? JSON.parse(data.properties) : data.properties).length > 4 && (
								<Badge variant="secondary" className="text-xs">
									+{(typeof data.properties === 'string' ? JSON.parse(data.properties) : data.properties).length - 4}
								</Badge>
							)}
						</div>
					</div>
				)}

				{/* Requisitos */}
				{'requirements' in data && data.requirements && (
					<div className="mb-4">
						<h4 className="text-sm font-semibold mb-2 flex items-center">
							<Gauge className="h-4 w-4 mr-2" />
							Requisitos
						</h4>
						<div className="text-xs text-muted-foreground">
							{Object.entries(
								typeof data.requirements === 'string' ? JSON.parse(data.requirements) : data.requirements
							).map(([key, value]) => (
								<div
									key={`detail-${key}`}
									className="flex justify-between items-center border-b border-muted pb-1 mb-1 last:border-0"
								>
									<span>{key}:</span>
									<span className="font-semibold">
										{Array.isArray(value)
											? value.join(', ')
											: value !== null && value !== undefined
												? String(value)
												: ''}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Origen */}
				{'origin' in data && data.origin && (
					<div className="mb-4">
						<h4 className="text-sm font-semibold mb-1 flex items-center">
							<ScrollText className="h-4 w-4 mr-2" />
							Origen
						</h4>
						<p className="text-xs text-muted-foreground line-clamp-2">{data.origin}</p>
					</div>
				)}

				{/* Footer */}
				<div className="mt-auto pt-4 flex items-center justify-between">
					<div className="flex items-center text-xs text-muted-foreground">
						<Clock className="h-3.5 w-3.5 mr-1.5" />
						{'createdAt' in data && data.createdAt && <span>{formatDate(data.createdAt as Date)}</span>}
					</div>

					{onEdit && onDelete && (
						<div className="flex gap-2">
							<Button
								size="icon"
								variant="ghost"
								className="h-8 w-8"
								onClick={() => {
									onEdit(data as PrismaWorldItem);
								}}
							>
								<PencilIcon className="h-4 w-4" />
							</Button>
							<Button
								size="icon"
								variant="ghost"
								className="h-8 w-8 text-destructive"
								onClick={() => {
									if (data.id) {
										onDelete(data.id);
									}
								}}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}
