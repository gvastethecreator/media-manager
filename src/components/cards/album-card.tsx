'use client';

import type { AlbumWithStats } from '@/app/actions/album.actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatBytes, formatDate } from '@/lib/utils';
import { Album as AlbumIcon, Clock, Hash, Image as ImageIcon, PencilIcon, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';

interface AlbumCardProps {
	album: AlbumWithStats;
	onEdit?: (album: AlbumWithStats) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

export function AlbumCard({ album, onEdit, onDelete, className }: AlbumCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

	// Manejar el movimiento del mouse para efectos místicos
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

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
			{/* Fondo místico con runas */}
			<div
				className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
				style={{
					background: `
						radial-gradient(
							circle at var(--x) var(--y),
							${album.color}44,
							transparent 50%
						)
					`,
				}}
			/>

			{/* Patrón de runas */}
			<div
				className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
				style={{
					backgroundImage: `
						repeating-linear-gradient(
							${45 + (mousePosition.x / 100) * 90}deg,
							${album.color}11 0px,
							transparent 1px,
							transparent 10px
						),
						repeating-linear-gradient(
							${-45 + (mousePosition.x / 100) * 90}deg,
							${album.color}11 0px,
							transparent 1px,
							transparent 10px
						)
					`,
				}}
			/>

			{/* Marco místico */}
			<div
				className="absolute inset-[2px] rounded-lg"
				style={{
					background: `
						linear-gradient(
							${45 + (mousePosition.x / 100) * 90}deg,
							transparent,
							${album.color}22
						)
					`,
					border: `2px solid ${album.color}44`,
					boxShadow: `
						inset 0 0 10px ${album.color}22,
						0 0 10px ${album.color}22
					`,
				}}
			/>

			{/* Efecto de energía mística */}
			<div
				className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
				style={{
					background: `
						conic-gradient(
							from ${(mousePosition.x / 100) * 360}deg at var(--x) var(--y),
							${album.color}00,
							${album.color}22,
							${album.color}00
						)
					`,
				}}
			/>

			{/* Contenido de la carta */}
			<div className="relative h-full p-4 flex flex-col backdrop-blur-xs">
				{/* Encabezado */}
				<div className="flex items-center gap-3 mb-4">
					<div
						className={cn(
							'h-12 w-12 rounded-full flex items-center justify-center',
							'bg-linear-to-br shadow-inner relative overflow-hidden',
							'group-hover:shadow-lg transition-shadow duration-300'
						)}
						style={{
							background: `
								radial-gradient(
									circle at center,
									${album.color}44,
									${album.color}22
								)
							`,
							border: `2px solid ${album.color}44`,
						}}
					>
						{album.emoji ? (
							<span className="text-2xl relative z-10 transition-transform duration-300 group-hover:rotate-12">
								{album.emoji}
							</span>
						) : (
							<AlbumIcon
								className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:rotate-12"
								style={{ color: album.color }}
							/>
						)}
						{/* Aura mística */}
						<div
							className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300"
							style={{
								background: `
									radial-gradient(
										circle at center,
										${album.color}44,
										transparent 70%
									)
								`,
							}}
						/>
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-lg leading-tight truncate">{album.name}</h3>
						{album.shortcut && (
							<div className="flex items-center gap-1 text-sm text-muted-foreground">
								<Hash className="h-3 w-3" />
								<code
									className="text-xs px-1 rounded relative overflow-hidden"
									style={{
										background: `
											linear-gradient(
												${135 + (mousePosition.x / 100) * 90}deg,
												${album.color}11,
												${album.color}22
											)
										`,
									}}
								>
									{album.shortcut}
								</code>
							</div>
						)}
					</div>
				</div>

				{/* Descripción */}
				{album.description && (
					<div className="mb-4">
						<p className="text-sm text-muted-foreground line-clamp-3">{album.description}</p>
					</div>
				)}

				{/* Contador de imágenes */}
				<div className="mt-auto">
					<div className="flex items-center gap-1 text-sm text-muted-foreground">
						<ImageIcon className="h-3 w-3" />
						<span>
							{album._count.images} {album._count.images === 1 ? 'imagen' : 'imágenes'}
						</span>
						<span className="mx-1">•</span>
						<span>{formatBytes(album.totalSize)}</span>
					</div>
					<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
						<Clock className="h-3 w-3" />
						<span>Actualizado {formatDate(album.lastUpdated)}</span>
					</div>
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
							onClick={() => onEdit(album)}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-background/80 backdrop-blur-xs text-destructive"
							onClick={() => onDelete(album.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</motion.div>

				{/* Partículas místicas */}
				<div
					className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
					style={{
						background: `
							radial-gradient(
								circle at var(--x) var(--y),
								${album.color}44,
								transparent 20%
							)
						`,
					}}
				/>
			</div>
		</motion.div>
	);
}
