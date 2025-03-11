'use client';

import type { AlbumWithStats } from '@/app/actions/albums/album.actions';
import type { AlbumFormData } from '@/components/features/entity-cards/entity-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { formatBytes, formatDate } from '@/lib/utils/utils';
import { Album as AlbumIcon, Camera, Clock, Hash, Image as ImageIcon, PencilIcon, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

type CardData = AlbumWithStats | AlbumFormData;

interface AlbumCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (album: AlbumWithStats) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

function getRandomGradient() {
	const gradients = [
		'from-violet-500/20 to-fuchsia-500/20',
		'from-cyan-500/20 to-blue-500/20',
		'from-pink-500/20 to-rose-500/20',
		'from-amber-500/20 to-orange-500/20',
		'from-lime-500/20 to-emerald-500/20',
		'from-teal-500/20 to-cyan-500/20',
		'from-indigo-500/20 to-purple-500/20',
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

export function AlbumCard({ data, isPreview = false, onEdit, onDelete, className }: AlbumCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	const gradient = getRandomGradient();

	// Para componente preview, detectar cambios y animar
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

		const prevData = prevDataRef.current;
		const hasChanged =
			prevData.name !== data.name ||
			prevData.emoji !== data.emoji ||
			('color' in prevData && 'color' in data && prevData.color !== data.color);

		if (hasChanged) {
			prevDataRef.current = { ...data };
		}
	}, [data, isPreview]);

	// Manejar el movimiento del mouse para efectos místicos
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
					'group relative flex h-48 flex-col overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 hover:border-primary',
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
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
							<Camera className="h-4 w-4 text-blue-500" />
						</div>
						<h3 className="text-xl font-semibold line-clamp-1">{data.name || 'Sin nombre'}</h3>
					</div>

					{/* Detalles */}
					<div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center space-x-2">
							<span className="inline-flex items-center rounded-full border px-2 py-0.5">{data.emoji || '📷'}</span>
						</div>
						<div className="flex items-center space-x-2">
							<span className="flex items-center">0 imágenes</span>
						</div>
					</div>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			className={cn(
				'relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden group',
				'bg-linear-to-br from-background/50 to-muted/50',
				'shadow-lg hover:shadow-xl transition-all duration-300',
				'cursor-pointer perspective-1000',
				className
			)}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			onMouseMove={handleMouseMove}
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.2 }}
			style={
				{
					'--x': `${mousePosition.x}%`,
					'--y': `${mousePosition.y}%`,
				} as React.CSSProperties
			}
		>
			{/* Fondo con textura de cámara vintage */}
			<div
				className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
				style={{
					backgroundImage: `
						radial-gradient(
							circle at 50% 50%,
							rgba(59, 130, 246, 0.2) 0%,
							transparent 35%
						),
						radial-gradient(
							circle at 80% 20%,
							rgba(59, 130, 246, 0.2) 0%,
							transparent 25%
						)
					`,
				}}
			/>

			{/* Patrón de película fotográfica */}
			<div
				className="absolute inset-0 z-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
				style={{
					backgroundImage: `
						repeating-linear-gradient(
							${45 + (mousePosition.x / 100) * 45}deg,
							transparent 0px,
							transparent 10px,
							rgba(59, 130, 246, 0.1) 10px,
							rgba(59, 130, 246, 0.1) 11px
						)
					`,
				}}
			/>

			{/* Contenido de la carta */}
			<div className="relative h-full p-4 flex flex-col z-10">
				{/* Encabezado */}
				<div className="flex items-center gap-3 mb-4">
					<div
						className={cn(
							'h-12 w-12 rounded-full flex items-center justify-center',
							'bg-blue-500/20',
							'group-hover:bg-blue-500/30 transition-colors duration-300'
						)}
					>
						<AlbumIcon className="h-6 w-6 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-lg leading-tight truncate">{data.name}</h3>
						{'emoji' in data && data.emoji && (
							<div className="inline-flex items-center space-x-1 text-sm text-muted-foreground">
								<span>{data.emoji}</span>
								<span className="text-xs opacity-60">álbum</span>
							</div>
						)}
					</div>
				</div>

				{/* Información del álbum */}
				<div className="flex flex-col gap-2 mt-auto">
					<div
						className="rounded-lg p-3 bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300"
						style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
					>
						{'_count' in data && data._count ? (
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<ImageIcon className="h-4 w-4 text-blue-500/80" />
									<span className="text-sm">{data._count.images || 0} imágenes</span>
								</div>
								{'totalSize' in data && data.totalSize && (
									<span className="text-xs text-muted-foreground">{formatBytes(data.totalSize)}</span>
								)}
							</div>
						) : (
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<AlbumIcon className="h-4 w-4 text-blue-500/80" />
									<span className="text-sm">Álbum</span>
								</div>
							</div>
						)}
					</div>

					{'createdAt' in data && (
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
							<Clock className="h-3 w-3" />
							<span>Creado {formatDate(data.createdAt)}</span>
						</div>
					)}
				</div>

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
							className="h-8 w-8 bg-background/80 backdrop-blur-xs"
							onClick={() => {
								onEdit(data as AlbumWithStats);
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
				</motion.div>
			</div>
		</motion.div>
	);
}
