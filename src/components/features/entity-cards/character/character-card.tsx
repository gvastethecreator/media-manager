"use client";

import type { CharacterFormData } from "@/components/features/entity-cards/entity-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import type { Character } from "@prisma/client";
import {
	Crown,
	Heart,
	ImageIcon,
	PencilIcon,
	ScrollText,
	Shield,
	Sparkles,
	Swords,
	Trash2,
	User2,
	Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type * as React from "react";
import { useRef, useState } from "react";

type CardData =
	| (Character & {
			_count?: { images: number };
			totalSize?: number;
			featuredImage?: string | null;
	  })
	| CharacterFormData;

interface CharacterCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (character: Character) => void;
	onDelete?: (id: string) => void;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
}

const getClassGradient = (characterClass: string) => {
	const classMap: Record<string, string> = {
		guerrero: "from-red-500 to-orange-500",
		mago: "from-blue-500 to-indigo-500",
		clérigo: "from-yellow-500 to-amber-500",
		pícaro: "from-purple-500 to-fuchsia-500",
		druida: "from-green-500 to-emerald-500",
		bardo: "from-pink-500 to-rose-500",
		paladín: "from-sky-500 to-cyan-500",
		monje: "from-amber-500 to-yellow-500",
		default: "from-slate-500 to-gray-500",
	};
	return classMap[characterClass.toLowerCase()] || classMap.default;
};

const getClassSymbol = (characterClass: string) => {
	const classMap: Record<string, React.ReactNode> = {
		guerrero: <Swords className="h-5 w-5" />,
		mago: <Sparkles className="h-5 w-5" />,
		clérigo: <Heart className="h-5 w-5" />,
		pícaro: <User2 className="h-5 w-5" />,
		druida: <ScrollText className="h-5 w-5" />,
		bardo: <Users className="h-5 w-5" />,
		paladín: <Shield className="h-5 w-5" />,
		monje: <Crown className="h-5 w-5" />,
	};
	return (
		classMap[characterClass.toLowerCase()] || <User2 className="h-5 w-5" />
	);
};

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

export function CharacterCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
}: CharacterCardProps) {
	const [_isHovered, setIsHovered] = useState(false);
	const [_gradient] = useState(getRandomGradient());
	const cardRef = useRef<HTMLDivElement>(null);

	// Handlers
	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && "id" in data) {
			onEdit(data as Character);
		}
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && "id" in data && data.id) {
			onDelete(data.id);
		}
	};

	// Versiones compatibles con el componente Button
	const handleEditButton = () => {
		// Simulamos un evento para mantener la lógica existente
		const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent;
		handleEdit(syntheticEvent);
	};

	const handleDeleteButton = () => {
		// Simulamos un evento para mantener la lógica existente
		const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent;
		handleDelete(syntheticEvent);
	};

	const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (onClick) {
			onClick(e);
		}
	};

	// Determinar el gradiente basado en la clase del personaje
	const classGradient =
		"class" in data && data.class
			? getClassGradient(data.class)
			: "from-slate-500 to-gray-500";

	// Determinar el símbolo de clase
	const classSymbol =
		"class" in data && data.class ? (
			getClassSymbol(data.class)
		) : (
			<User2 className="h-5 w-5" />
		);

	// Determinar si hay una imagen destacada
	const hasFeaturedImage = "featuredImage" in data && data.featuredImage;

	// Determinar el número de imágenes
	const imageCount =
		"_count" in data && data._count?.images ? data._count.images : 0;

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
			ref={cardRef}
		>
			<div
				className={cn(
					"overflow-hidden rounded-lg border-2 shadow-md transition-all duration-300",
					"hover:shadow-lg hover:transform hover:-translate-y-1",
					onClick ? "cursor-pointer" : ""
				)}
			>
				{/* Cabecera con gradiente y título */}
				<div className={cn("relative h-40 bg-gradient-to-br", classGradient)}>
					{/* Imagen destacada si existe */}
					{hasFeaturedImage && (
						<div className="absolute inset-0">
							<Image
								src={data.featuredImage as string}
								alt={data.name}
								fill
								className="object-cover opacity-40"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
						</div>
					)}

					{/* Información del personaje */}
					<div className="absolute bottom-0 left-0 right-0 p-3 text-white">
						<div className="flex items-center gap-2">
							<div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
								{data.emoji || classSymbol}
							</div>
							<div>
								<h3 className="text-lg font-bold truncate">{data.name}</h3>
								{"class" in data &&
									data.class &&
									"race" in data &&
									data.race && (
										<div className="text-xs opacity-90">
											{data.race} {data.class}
										</div>
									)}
							</div>
						</div>
					</div>

					{/* Nivel */}
					{"level" in data && data.level !== undefined && (
						<div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold">
							Nivel {data.level}
						</div>
					)}

					{/* Contador de imágenes */}
					{imageCount > 0 && (
						<div className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
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
					<div className="grid grid-cols-2 gap-2 text-xs">
						{"alignment" in data && data.alignment && (
							<Badge variant="outline" className="justify-center">
								{data.alignment}
							</Badge>
						)}

						{"personality" in data && data.personality && (
							<Badge variant="outline" className="justify-center">
								Personalidad
							</Badge>
						)}

						{"goals" in data && data.goals && (
							<Badge variant="outline" className="justify-center">
								Objetivos
							</Badge>
						)}

						{"fears" in data && data.fears && (
							<Badge variant="outline" className="justify-center">
								Miedos
							</Badge>
						)}
					</div>

					{/* Estadísticas de combate */}
					{"stats" in data && data.stats && (
						<div className="mt-3 p-2 bg-gray-50 rounded-md text-xs">
							<div className="font-medium mb-1 text-gray-700">
								Estadísticas:
							</div>
							<div className="grid grid-cols-3 gap-1">
								{data.stats
									.split(",")
									.slice(0, 6)
									.map((stat) => {
										const [name, value] = stat.split(":");
										// Usamos el nombre como clave única, si está vacío usamos un ID generado con Math.random
										return (
											<div
												key={
													name ||
													`stat-${Math.random().toString(36).substr(2, 9)}`
												}
												className="flex flex-col items-center"
											>
												<span className="text-gray-500">{name}</span>
												<span className="font-bold">{value || "?"}</span>
											</div>
										);
									})}
							</div>
						</div>
					)}
				</div>

				{/* Barra inferior con acciones */}
				<div className="border-t px-3 py-2 bg-gray-50 flex justify-between items-center">
					{/* Clase y raza */}
					<div className="text-xs text-gray-500">
						{"class" in data && data.class ? (
							<span className="capitalize">{data.class}</span>
						) : (
							<span>Personaje</span>
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
									onClick={handleEditButton}
								>
									<PencilIcon className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 bg-background/80 hover:bg-background hover:text-destructive"
									onClick={handleDeleteButton}
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
