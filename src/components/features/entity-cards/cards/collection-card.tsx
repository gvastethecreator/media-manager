'use client';

import type { CollectionFormData } from '@/components/features/entity-cards/forms/entity-types';
import { Button } from '@/components/ui/button';
import { cn, formatBytes } from '@/lib/utils';
import type { Collection } from '@prisma/client';
import { FolderIcon, ImageIcon, PencilIcon, TagIcon, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AnimatePresence } from 'motion/react';
import Image from 'next/image';
import * as React from 'react';

type CardData =
	| (Collection & {
			_count?: { images: number };
			totalSize?: number;
			recentImages?: string[];
			topTags?: { name: string; count: number }[];
	  })
	| CollectionFormData;

interface CollectionCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (collection: Collection) => void;
	onDelete?: (id: string) => void;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
}

function getRandomGradient() {
	const gradients = [
		'from-rose-500/20 to-indigo-500/20',
		'from-emerald-500/20 to-sky-500/20',
		'from-amber-500/20 to-pink-500/20',
		'from-violet-500/20 to-orange-500/20',
		'from-cyan-500/20 to-yellow-500/20',
		'from-fuchsia-500/20 to-lime-500/20',
		'from-purple-500/20 to-teal-500/20',
		'from-blue-500/20 to-red-500/20',
		'from-green-500/20 to-purple-500/20',
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

// Función auxiliar para verificar si estamos en modo preview
function isFormData(data: CardData): data is CollectionFormData {
	return data !== undefined && 'editions' in data;
}

export function CollectionCard({ data, isPreview = false, onEdit, onDelete, onClick, className }: CollectionCardProps) {
	// Definir todos los estados al inicio
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	const [isHovered, setIsHovered] = React.useState(false);
	const [animateUpdate, setAnimateUpdate] = React.useState(false);
	const prevDataRef = React.useRef<CardData | null>(null);
	const gradient = getRandomGradient();

	// Definir todos los handlers
	const handleMouseMove = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!data) {
				return;
			}
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			setMousePosition({ x, y });
		},
		[data]
	);

	const handleEdit = React.useCallback(
		(e: React.MouseEvent) => {
			if (!data || !onEdit) {
				return;
			}
			e.stopPropagation();
			onEdit(data as Collection);
		},
		[data, onEdit]
	);

	const handleDelete = React.useCallback(
		(e: React.MouseEvent) => {
			if (!data || !onDelete || !data.id) {
				return;
			}
			e.stopPropagation();
			onDelete(data.id);
		},
		[data, onDelete]
	);

	// Todos los efectos
	React.useEffect(() => {
		if (!isPreview || !data) {
			return;
		}

		if (!prevDataRef.current) {
			prevDataRef.current = { ...data };
			return;
		}

		// Comparar propiedades del estado anterior y actual para determinar si hubo cambios
		const prevData = prevDataRef.current;
		if (
			prevData.name !== data.name ||
			prevData.description !== data.description ||
			prevData.emoji !== data.emoji ||
			prevData.color !== data.color
		) {
			setAnimateUpdate(true);
			setTimeout(() => setAnimateUpdate(false), 500);
		}

		prevDataRef.current = { ...data };
	}, [data, isPreview]);

	// Early return si data es undefined
	if (!data) {
		console.error('CollectionCard: data is undefined');
		return <div className="p-4 text-sm text-red-500">Error: Datos de colección no disponibles</div>;
	}

	// Renderizar versión para preview en diálogos
	if (isPreview) {
		return (
			<AnimatePresence mode="wait">
				<motion.div
					key={`${data.name}-${data.emoji}-${animateUpdate ? Date.now() : 'static'}`}
					className={cn(
						'group relative flex h-48 flex-col overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200',
						animateUpdate ? 'ring-2 ring-primary' : 'hover:border-primary',
						className
					)}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{
						opacity: 1,
						scale: 1,
						transition: { type: 'spring', stiffness: 500, damping: 30 },
					}}
					exit={{ opacity: 0, scale: 0.9 }}
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
							<span className="text-2xl">{data.emoji || '📁'}</span>
							<h3 className="text-xl font-semibold line-clamp-1">{data.name || 'Sin nombre'}</h3>
						</div>

						{/* Descripción */}
						{data.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{data.description}</p>}

						{/* Detalles */}
						<div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
							<div className="flex items-center space-x-2">
								<span className="flex items-center">
									<span
										className="mr-1.5 h-2.5 w-2.5 rounded-full"
										style={{ backgroundColor: data.color || '#3b82f6' }}
									/>
									Vista previa
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<span className="flex items-center">0 imágenes</span>
							</div>
						</div>
					</div>
				</motion.div>
			</AnimatePresence>
		);
	}

	// Renderizar tarjeta completa para vista normal
	return (
		<motion.div
			className={cn(
				'group relative overflow-hidden rounded-xl h-60 bg-background shadow-md transition-all duration-300 hover:shadow-lg',
				className
			)}
			whileHover={{ y: -5 }}
			layout
			onClick={onClick}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Fondo con gradiente  */}
			<div
				className={cn('absolute inset-0 bg-gradient-to-b from-primary/5 to-background')}
				style={{
					backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
				}}
			/>

			{/* Overlay de hover */}
			<div
				className={cn(
					'absolute inset-0 bg-gradient-to-b from-transparent to-background/80 transition-opacity duration-300',
					isHovered ? 'opacity-100' : 'opacity-0'
				)}
			/>

			{isFormData(data) ? (
				<div className="relative z-30 h-full p-4 flex flex-col">
					{/* Contenido para data tipo CollectionFormData */}
					<div className="flex items-center gap-2">
						<div
							className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
							style={{
								background: `linear-gradient(135deg, ${data.color}, ${data.color}80)`,
							}}
						>
							<span className="text-2xl filter drop-shadow-lg">{data.emoji}</span>
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-lg font-bold truncate text-white drop-shadow-lg">{data.name}</h3>
							{data.description && <p className="text-sm text-white/80 truncate">{data.description}</p>}
						</div>
					</div>
					<div className="mt-auto">
						<Button variant="secondary" size="sm" className="gap-2 w-full">
							<FolderIcon className="w-4 h-4" />
							Vista previa de colección
						</Button>
					</div>
				</div>
			) : (
				// Contenido para Collection completa
				<div className="relative z-30 h-full p-4 flex flex-col">
					{/* Encabezado */}
					<div className="flex items-center gap-2">
						<div
							className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
							style={{
								background: `linear-gradient(135deg, ${data.color}, ${data.color}80)`,
							}}
						>
							<span className="text-2xl filter drop-shadow-lg">{data.emoji}</span>
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-lg font-bold truncate text-white drop-shadow-lg">{data.name}</h3>
							{data.description && <p className="text-sm text-white/80 truncate">{data.description}</p>}
						</div>
					</div>

					{/* Grid de imágenes recientes */}
					<div className="relative mt-4 flex-1">
						<div className="grid grid-cols-3 gap-2 h-full bg-background/50 rounded-lg p-2">
							{data.recentImages && data.recentImages.length > 0
								? data.recentImages.map((src, i) => (
										<div
											key={`${data.id}-image-${i}-${src?.substring(0, 10) || 'empty'}`}
											className="relative rounded-md overflow-hidden aspect-square"
										>
											{src ? (
												<div className="relative w-full h-full">
													<Image
														src={src}
														alt={`Imagen ${i + 1}`}
														fill
														className="object-cover transition-transform group-hover:scale-105"
													/>
												</div>
											) : (
												<div
													className={cn('w-full h-full flex items-center justify-center', 'bg-linear-to-br', gradient)}
												>
													<ImageIcon className="w-4 h-4 text-white/80" />
												</div>
											)}
										</div>
									))
								: Array.from({ length: 9 }).map((_, i) => (
										<div
											key={`${data.id}-placeholder-${i}`}
											className={cn(
												'relative rounded-md overflow-hidden aspect-square',
												'flex items-center justify-center',
												'bg-linear-to-br',
												gradient
											)}
										>
											<ImageIcon className="w-4 h-4 text-white/80" />
										</div>
									))}
						</div>

						{/* Overlay con hover */}
						<div
							className={cn(
								'absolute inset-0 bg-linear-to-t from-background/80 to-transparent',
								'opacity-0 group-hover:opacity-100 transition-opacity',
								'rounded-lg flex items-end justify-center p-4'
							)}
						>
							<Button variant="secondary" size="sm" className="gap-2">
								<ImageIcon className="w-4 h-4" />
								{data.recentImages && data.recentImages.length > 0 ? 'Ver todas las imágenes' : 'Colección vacía'}
							</Button>
						</div>
					</div>

					{/* Estadísticas */}
					<div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center gap-2">
							<span className="flex items-center gap-1">
								<ImageIcon className="w-3.5 h-3.5" />
								{data._count?.images || 0} imágenes
							</span>
							<span className="flex items-center gap-1">
								<TagIcon className="w-3.5 h-3.5" />
								{data.topTags?.length || 0} etiquetas
							</span>
						</div>
						<span className="text-xs">{data.totalSize ? formatBytes(data.totalSize) : '0 B'}</span>
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
								className="h-8 w-8 bg-background/80 hover:bg-background"
								onClick={handleEdit}
							>
								<PencilIcon className="h-4 w-4" />
							</Button>
						)}
						{onDelete && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 bg-background/80 hover:bg-background hover:text-destructive"
								onClick={handleDelete}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
			)}
		</motion.div>
	);
}
