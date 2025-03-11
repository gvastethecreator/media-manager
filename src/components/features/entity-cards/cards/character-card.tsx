"use client";

import type { CharacterFormData } from "@/components/features/entity-cards/forms/entity-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
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
import { motion } from "motion/react";
import * as React from "react";
import { useEffect, useRef } from "react";

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
	const gradients = {
		Guerrero: "from-red-500/20 via-orange-500/20 to-red-500/20",
		Mago: "from-blue-500/20 via-purple-500/20 to-blue-500/20",
		Clérigo: "from-yellow-500/20 via-white/20 to-yellow-500/20",
		Pícaro: "from-green-500/20 via-emerald-500/20 to-green-500/20",
		default: "from-slate-500/20 via-gray-500/20 to-slate-500/20",
	};
	return (
		gradients[characterClass as keyof typeof gradients] || gradients.default
	);
};

const getClassSymbol = (characterClass: string) => {
	const symbols = {
		Guerrero: "⚔️",
		Mago: "🔮",
		Clérigo: "✨",
		Pícaro: "🗡️",
		default: "⭐",
	};
	return symbols[characterClass as keyof typeof symbols] || symbols.default;
};

function getRandomGradient() {
	const gradients = [
		"from-pink-500/20 to-purple-500/20",
		"from-indigo-500/20 to-blue-500/20",
		"from-orange-500/20 to-red-500/20",
		"from-green-500/20 to-teal-500/20",
		"from-amber-500/20 to-yellow-500/20",
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

	// Manejar el movimiento del mouse
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
					"group relative flex h-64 flex-col overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 hover:border-primary",
					isHovered && "shadow-lg",
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
						"absolute inset-0 z-0 bg-gradient-to-br opacity-50 transition-opacity duration-300",
						gradient,
						isHovered && "opacity-80"
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
							style={{ backgroundColor: data?.color }}
						>
							<User2 className="h-5 w-5 text-white" />
						</div>
						<div>
							<h3 className="text-xl font-semibold line-clamp-1">
								{data.name || "Sin nombre"}
							</h3>
							{data && "class" in data && data.class && (
								<p className="text-sm text-muted-foreground">{data.class}</p>
							)}
						</div>
						{data && "race" in data && data.race && (
							<Badge variant="outline" className="ml-auto">
								{data.race}
							</Badge>
						)}
					</div>

					{/* Descripción */}
					{data?.description && (
						<p className="mt-2 text-sm text-muted-foreground line-clamp-3">
							{data.description}
						</p>
					)}

					{/* Atributos */}
					<div className="mt-4 grid grid-cols-2 gap-2">
						{data && "alignment" in data && data.alignment && (
							<div className="flex items-center space-x-2">
								<span className="text-xs font-medium text-muted-foreground">
									Alineamiento:
								</span>
								<span className="text-xs">{data.alignment}</span>
							</div>
						)}
						{data && "personality" in data && data.personality && (
							<div className="flex items-center space-x-2">
								<span className="text-xs font-medium text-muted-foreground">
									Personalidad:
								</span>
								<span className="text-xs line-clamp-1">{data.personality}</span>
							</div>
						)}
					</div>

					{/* Detalles */}
					<div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center space-x-2">
							<span className="inline-flex items-center rounded-full border px-2 py-0.5">
								{data.emoji || "👤"}
							</span>
						</div>
						<div className="flex items-center space-x-2">
							<span className="flex items-center">Personaje</span>
						</div>
					</div>
				</div>
			</motion.div>
		);
	}

	// Para la versión completa, necesitamos acceder a propiedades específicas
	const classGradient =
		data && "class" in data
			? getClassGradient(data.class)
			: "from-slate-500/20 via-gray-500/20 to-slate-500/20";
	const classSymbol = data && "class" in data ? getClassSymbol(data.class) : "⭐";

	return (
		<motion.div
			className={cn(
				"relative w-full aspect-[2/3] rounded-lg overflow-hidden group",
				"bg-linear-to-br from-background/50 to-muted/50",
				"shadow-lg hover:shadow-xl transition-all duration-300",
				"cursor-pointer",
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
					"absolute inset-0 bg-gradient-to-b opacity-80",
					classGradient
				)}
			/>

			{/* Overlay de hover */}
			<div
				className={cn(
					"absolute inset-0 bg-gradient-to-t from-black/80 to-transparent",
					"opacity-60 group-hover:opacity-80 transition-opacity duration-300"
				)}
			/>

			{/* Contenido */}
			<div className="relative z-10 h-full p-4 flex flex-col">
				{/* Encabezado */}
				<div className="flex items-center gap-2">
					<div
						className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
						style={{
							background: `linear-gradient(135deg, ${data?.color || "#6366f1"}, ${data?.color || "#6366f1"}80)`,
						}}
					>
						<span className="text-2xl filter drop-shadow-lg">{data?.emoji || "👤"}</span>
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="text-lg font-bold truncate text-white drop-shadow-lg">
							{data?.name || "Sin nombre"}
						</h3>
						{data && "class" in data && data.class && (
							<div className="flex items-center gap-1.5">
								<span className="text-sm text-white/80">{data.class}</span>
								<span>{classSymbol}</span>
							</div>
						)}
					</div>
				</div>

				{/* Información del personaje */}
				<div className="mt-4 space-y-3">
					{data?.description && (
						<p className="text-sm text-white/80 line-clamp-3">
							{data.description}
						</p>
					)}

					{data && "race" in data && data.race && (
						<div className="flex items-center gap-2 text-sm">
							<span className="text-white/60">Raza:</span>
							<span className="text-white">{data.race}</span>
						</div>
					)}

					{data && "alignment" in data && data.alignment && (
						<div className="flex items-center gap-2 text-sm">
							<span className="text-white/60">Alineamiento:</span>
							<span className="text-white">{data.alignment}</span>
						</div>
					)}
				</div>

				{/* Estadísticas */}
				<div className="mt-auto">
					{data && "_count" in data && data._count && (
						<div className="flex items-center justify-between text-xs text-white/60 mb-2">
							<div className="flex items-center gap-2">
								<ImageIcon className="h-3.5 w-3.5" />
								<span>{data._count.images || 0} imágenes</span>
							</div>
							{data && "totalSize" in data && data.totalSize && (
								<span>{formatBytes(data.totalSize)}</span>
							)}
						</div>
					)}

					{/* Iconos de atributos */}
					<div className="flex items-center justify-between">
						<div className="flex -space-x-1">
							<div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center">
								<Heart className="h-3 w-3 text-red-500" />
							</div>
							<div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
								<Shield className="h-3 w-3 text-blue-500" />
							</div>
							<div className="h-6 w-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
								<Crown className="h-3 w-3 text-yellow-500" />
							</div>
							<div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
								<Swords className="h-3 w-3 text-green-500" />
							</div>
						</div>
						<div className="flex items-center gap-1.5 text-xs text-white/60">
							<Users className="h-3.5 w-3.5" />
							<span>Personaje</span>
						</div>
					</div>
				</div>

				{/* Acciones */}
				<div
					className={cn(
						"absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200",
						isHovered && "opacity-100"
					)}
				>
					{onEdit && data?.id && (
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full h-8 w-8"
							onClick={() => onEdit(data as Character)}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && data?.id && (
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full h-8 w-8 text-destructive hover:text-destructive"
							onClick={() => onDelete(data.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</motion.div>
	);
}
