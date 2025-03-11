"use client";

import type { CollectionFormData } from "@/components/features/entity-cards/entity-types";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils/utils";
import type { Collection } from "@prisma/client";
import {
	FolderIcon,
	ImageIcon,
	PencilIcon,
	TagIcon,
	Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { AnimatePresence } from "motion/react";
import Image from "next/image";
import type * as React from "react";
import { useState } from "react";

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
		"from-blue-500 to-purple-500",
		"from-green-500 to-teal-500",
		"from-yellow-500 to-orange-500",
		"from-pink-500 to-rose-500",
		"from-indigo-500 to-blue-500",
		"from-amber-500 to-yellow-500",
		"from-emerald-500 to-green-500",
		"from-rose-500 to-pink-500",
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

function isFormData(data: CardData): data is CollectionFormData {
	return !("id" in data) || !data.id;
}

export function CollectionCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
}: CollectionCardProps) {
	const [_isHovered, setIsHovered] = useState(false);
	const [gradient] = useState(getRandomGradient());

	// Handlers
	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && !isFormData(data)) {
			onEdit(data as Collection);
		}
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && "id" in data && data.id) {
			onDelete(data.id);
		}
	};

	const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (onClick) {
			onClick(e);
		}
	};

	// Determinar si hay imágenes para mostrar
	const _hasImages =
		("recentImages" in data &&
			Array.isArray(data.recentImages) &&
			data.recentImages.length > 0) ||
		("_count" in data && data._count?.images && data._count.images > 0);

	// Determinar el número de imágenes
	const imageCount =
		"_count" in data && data._count?.images ? data._count.images : 0;

	// Determinar el tamaño total
	const totalSize =
		"totalSize" in data && data.totalSize ? formatBytes(data.totalSize) : null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.2 }}
			className={cn("relative group", className)}
			onClick={handleClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div
				className={cn(
					"overflow-hidden rounded-lg border-2 shadow-md transition-all duration-300",
					"hover:shadow-lg hover:transform hover:-translate-y-1",
					onClick ? "cursor-pointer" : ""
				)}
			>
				{/* Cabecera con gradiente y título */}
				<div className={cn("relative h-32 bg-gradient-to-br", gradient)}>
					{/* Imágenes recientes como mosaico */}
					{"recentImages" in data &&
						data.recentImages &&
						data.recentImages.length > 0 && (
							<div className="absolute inset-0 flex flex-wrap opacity-40">
								{data.recentImages.slice(0, 4).map((img, i) => (
									<div key={i} className="w-1/2 h-1/2 relative overflow-hidden">
										{img && (
											<Image src={img} alt="" fill className="object-cover" />
										)}
									</div>
								))}
							</div>
						)}

					{/* Overlay para mejorar legibilidad */}
					<div className="absolute inset-0 bg-black/20" />

					{/* Título y emoji */}
					<div className="absolute bottom-0 left-0 right-0 p-3 text-white">
						<div className="flex items-center gap-2">
							<div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm">
								{data.emoji || <FolderIcon className="w-4 h-4" />}
							</div>
							<h3 className="text-lg font-bold truncate">{data.name}</h3>
						</div>
					</div>

					{/* Contador de imágenes */}
					{imageCount > 0 && (
						<div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
							<ImageIcon className="w-3 h-3" />
							<span>{imageCount}</span>
						</div>
					)}
				</div>

				{/* Cuerpo de la tarjeta */}
				<div className="p-3 bg-white">
					{/* Descripción */}
					{data.description && (
						<p className="text-sm text-gray-600 line-clamp-2 mb-2">
							{data.description}
						</p>
					)}

					{/* Estadísticas */}
					<div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
						{/* Tamaño total */}
						{totalSize && (
							<div className="flex items-center gap-1">
								<span className="font-medium">Tamaño:</span> {totalSize}
							</div>
						)}

						{/* Plataforma */}
						{"platform" in data && data.platform && (
							<div className="flex items-center gap-1">
								<span className="font-medium">Plataforma:</span> {data.platform}
							</div>
						)}

						{/* Precio */}
						{"price" in data &&
							data.price !== undefined &&
							data.price !== null && (
								<div className="flex items-center gap-1">
									<span className="font-medium">Precio:</span> {data.price}€
								</div>
							)}
					</div>

					{/* Tags populares */}
					{"topTags" in data && data.topTags && data.topTags.length > 0 && (
						<div className="mt-3">
							<div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
								<TagIcon className="w-3 h-3" />
								<span>Tags populares:</span>
							</div>
							<div className="flex flex-wrap gap-1">
								{data.topTags.slice(0, 5).map((tag) => (
									<span
										key={tag.name}
										className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
									>
										{tag.name} ({tag.count})
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Barra inferior con acciones */}
				<div className="border-t px-3 py-2 bg-gray-50 flex justify-between items-center">
					{/* URL o ediciones */}
					<div className="text-xs text-gray-500 truncate max-w-[70%]">
						{"url" in data && data.url ? (
							<span className="truncate">{data.url}</span>
						) : "editions" in data && data.editions ? (
							<span>{data.editions}</span>
						) : (
							<span>Colección</span>
						)}
					</div>

					{/* Botones de acción */}
					{!isPreview && (
						<div className="flex gap-1">
							{onEdit && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 bg-background/80 hover:bg-background"
									onClick={(e: React.MouseEvent) => handleEdit(e)}
								>
									<PencilIcon className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 bg-background/80 hover:bg-background hover:text-destructive"
									onClick={(e: React.MouseEvent) => handleDelete(e)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}
