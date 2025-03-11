"use client";

import type { PlaceFormData } from "@/components/features/entity-cards/entity-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { formatBytes } from "@/lib/utils/utils";
import type { Place } from "@prisma/client";
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
	Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type * as React from "react";
import { useState } from "react";

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
	const climateMap: Record<string, React.ReactNode> = {
		tropical: <Cloud className="h-4 w-4 text-yellow-500" />,
		templado: <Cloud className="h-4 w-4 text-blue-500" />,
		árido: <Mountain className="h-4 w-4 text-amber-500" />,
		polar: <Cloud className="h-4 w-4 text-cyan-500" />,
		continental: <Cloud className="h-4 w-4 text-green-500" />,
		mediterráneo: <Cloud className="h-4 w-4 text-orange-500" />,
		default: <Cloud className="h-4 w-4 text-gray-500" />,
	};
	return climateMap[climate.toLowerCase()] || climateMap.default;
};

const getTypeIcon = (type: string) => {
	const typeMap: Record<string, React.ReactNode> = {
		ciudad: <Building2 className="h-4 w-4 text-blue-500" />,
		pueblo: <MapPin className="h-4 w-4 text-green-500" />,
		ruinas: <Skull className="h-4 w-4 text-amber-500" />,
		fortaleza: <Shield className="h-4 w-4 text-red-500" />,
		templo: <Scroll className="h-4 w-4 text-purple-500" />,
		bosque: <Mountain className="h-4 w-4 text-emerald-500" />,
		montaña: <Mountain className="h-4 w-4 text-gray-500" />,
		isla: <Globe className="h-4 w-4 text-cyan-500" />,
		default: <Compass className="h-4 w-4 text-gray-500" />,
	};
	return typeMap[type.toLowerCase()] || typeMap.default;
};

function getRandomGradient() {
	const gradients = [
		"from-blue-500 to-cyan-500",
		"from-green-500 to-emerald-500",
		"from-amber-500 to-yellow-500",
		"from-purple-500 to-indigo-500",
		"from-rose-500 to-pink-500",
		"from-slate-500 to-gray-500",
		"from-teal-500 to-green-500",
		"from-orange-500 to-amber-500",
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

export function PlaceCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
}: PlaceCardProps) {
	const [_isHovered, setIsHovered] = useState(false);
	const [gradient] = useState(getRandomGradient());

	// Handlers
	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && "id" in data) {
			onEdit(data as Place);
		}
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && "id" in data && data.id) {
			onDelete(data.id);
		}
	};

	const handleClick = () => {
		if (onClick) {
			onClick();
		}
	};

	// Determinar si hay una imagen destacada
	const hasFeaturedImage = "featuredImage" in data && data.featuredImage;

	// Determinar el número de imágenes
	const imageCount =
		"_count" in data && data._count?.images ? data._count.images : 0;

	// Determinar el tamaño total
	const _totalSize =
		"totalSize" in data && data.totalSize ? formatBytes(data.totalSize) : null;

	// Obtener iconos para clima y tipo
	const climateIcon =
		"climate" in data && data.climate ? getClimateIcon(data.climate) : null;
	const typeIcon = "type" in data && data.type ? getTypeIcon(data.type) : null;

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
				<div className={cn("relative h-36 bg-gradient-to-br", gradient)}>
					{/* Imagen destacada si existe */}
					{hasFeaturedImage && (
						<div className="absolute inset-0">
							<Image
								src={data.featuredImage as string}
								alt={data.name}
								fill
								className="object-cover opacity-50"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
						</div>
					)}

					{/* Información del lugar */}
					<div className="absolute bottom-0 left-0 right-0 p-3 text-white">
						<div className="flex items-center gap-2">
							<div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
								{data.emoji || typeIcon || <MapPin className="h-5 w-5" />}
							</div>
							<div>
								<h3 className="text-lg font-bold truncate">{data.name}</h3>
								{"region" in data && data.region && (
									<div className="text-xs opacity-90">
										Región: {data.region}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Contador de imágenes */}
					{imageCount > 0 && (
						<div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
							<ImageIcon className="w-3 h-3" />
							<span>{imageCount}</span>
						</div>
					)}

					{/* Clima */}
					{"climate" in data && data.climate && (
						<div className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
							{climateIcon}
							<span>{data.climate}</span>
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
					<div className="grid grid-cols-2 gap-2 text-xs">
						{"type" in data && data.type && (
							<Badge
								variant="outline"
								className="flex items-center gap-1 justify-center"
							>
								{typeIcon}
								<span>{data.type}</span>
							</Badge>
						)}

						{"population" in data && data.population !== undefined && (
							<Badge
								variant="outline"
								className="flex items-center gap-1 justify-center"
							>
								<Clock className="h-3 w-3" />
								<span>Población: {data.population}</span>
							</Badge>
						)}

						{"government" in data && data.government && (
							<Badge
								variant="outline"
								className="flex items-center gap-1 justify-center"
							>
								<Shield className="h-3 w-3" />
								<span>{data.government}</span>
							</Badge>
						)}

						{"dangers" in data && data.dangers && (
							<Badge
								variant="outline"
								className="flex items-center gap-1 justify-center"
							>
								<Skull className="h-3 w-3" />
								<span>Peligros</span>
							</Badge>
						)}
					</div>

					{/* Recursos */}
					{"resources" in data && data.resources && (
						<div className="mt-3 p-2 bg-gray-50 rounded-md text-xs">
							<div className="font-medium mb-1 text-gray-700">Recursos:</div>
							<p className="text-gray-600 line-clamp-2">{data.resources}</p>
						</div>
					)}
				</div>

				{/* Barra inferior con acciones */}
				<div className="border-t px-3 py-2 bg-gray-50 flex justify-between items-center">
					{/* Tipo y región */}
					<div className="text-xs text-gray-500 flex items-center gap-1">
						{typeIcon}
						<span>{"type" in data && data.type ? data.type : "Lugar"}</span>
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
