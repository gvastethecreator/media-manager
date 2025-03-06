"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
	Swords,
	Crown,
	Users,
	Heart,
	ScrollText,
	PencilIcon,
	Trash2,
	Shield,
	Sparkles,
	ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Character } from "@prisma/client";

interface CharacterCardProps {
	character: Character & {
		_count?: { images: number };
		totalSize?: number;
		featuredImage?: string | null;
	};
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

export function CharacterCard({
	character,
	onEdit,
	onDelete,
	onClick,
	className,
}: CharacterCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const classGradient = getClassGradient(character.class);
	const classSymbol = getClassSymbol(character.class);

	return (
		<motion.div
			className={cn(
				"relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden",
				"bg-linear-to-br from-background to-muted",
				"shadow-lg hover:shadow-xl transition-all duration-300",
				"cursor-pointer",
				className
			)}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.2 }}
			onClick={onClick}
		>
			{/* Fondo holográfico */}
			<div
				className={cn(
					"absolute inset-0 bg-linear-to-br opacity-30",
					classGradient
				)}
				style={{
					backgroundSize: "200% 200%",
					animation: isHovered ? "gradient 3s ease infinite" : "none",
				}}
			/>

			{/* Imagen destacada */}
			{character.featuredImage && (
				<div className="absolute inset-0 z-0">
					<div
						className="absolute inset-0 bg-cover bg-center"
						style={{
							backgroundImage: `url(${character.featuredImage})`,
							opacity: 0.15,
							filter: "blur(8px)",
						}}
					/>
					<div className="absolute inset-x-0 top-20 bottom-40 px-4">
						<div className="relative w-full h-full rounded-lg overflow-hidden">
							<img
								src={character.featuredImage}
								alt={character.name}
								className="object-cover w-full h-full"
							/>
							<div
								className="absolute inset-0"
								style={{
									background: `linear-gradient(to bottom,
										transparent 0%,
										${character.color}22 50%,
										${character.color}44 100%
									)`,
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Patrón de fondo basado en la clase */}
			<div
				className="absolute inset-0 opacity-5"
				style={{
					backgroundImage: `repeating-linear-gradient(
						45deg,
						${character.color}22,
						transparent 2px,
						transparent 10px
					)`,
				}}
			/>

			{/* Marco ornamentado */}
			<div
				className="absolute inset-[2px] rounded-lg border-2"
				style={{
					borderImage: `linear-gradient(
						to bottom right,
						${character.color}88,
						transparent,
						${character.color}88
					) 1`,
				}}
			/>

			{/* Contenido de la carta */}
			<div className="relative h-full p-4 flex flex-col">
				{/* Encabezado con nivel */}
				<div className="flex items-center justify-between mb-4 z-10">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"h-12 w-12 rounded-full flex items-center justify-center",
								"bg-linear-to-br shadow-inner",
								classGradient
							)}
							style={{
								border: `2px solid ${character.color}88`,
							}}
						>
							<span className="text-2xl filter drop-shadow-sm">
								{character.emoji || classSymbol}
							</span>
						</div>
						<div>
							<h3 className="font-bold text-lg leading-tight">
								{character.name}
							</h3>
							<div className="flex items-center gap-1 text-sm text-muted-foreground">
								<Users className="h-3 w-3" />
								<span>{character.race}</span>
								<span className="mx-1">•</span>
								<Crown className="h-3 w-3" />
								<span>Nivel {character.level}</span>
							</div>
						</div>
					</div>
					<div
						className={cn(
							"px-2 py-1 rounded text-sm font-semibold",
							"bg-linear-to-br shadow-xs",
							classGradient
						)}
					>
						{character.class}
					</div>
				</div>

				{/* Alineamiento y clase */}
				<div className="grid grid-cols-2 gap-2 mb-4 z-10">
					<div className="flex items-center gap-2 text-sm">
						<Heart className="h-4 w-4" style={{ color: character.color }} />
						<span>{character.alignment}</span>
					</div>
					<div className="flex items-center gap-2 text-sm">
						<Sparkles className="h-4 w-4" style={{ color: character.color }} />
						<span>{character.class}</span>
					</div>
				</div>

				{/* Espacio para la imagen destacada */}
				<div className="flex-1 z-0" />

				{/* Descripción */}
				{character.description && (
					<div className="mb-4 z-10 bg-background/80 backdrop-blur-xs rounded-lg p-2">
						<p className="text-sm text-muted-foreground line-clamp-2">
							{character.description}
						</p>
					</div>
				)}

				{/* Estadísticas */}
				{character.stats && (
					<div className="mt-auto pt-4 z-10">
						<div className="grid grid-cols-3 gap-2 text-[10px] font-medium">
							{Object.entries(JSON.parse(character.stats)).map(
								([key, value]) => (
									<div
										key={key}
										className={cn(
											"rounded px-2 py-1 text-center",
											"bg-linear-to-br shadow-xs bg-background/80 backdrop-blur-xs",
											classGradient
										)}
									>
										<div className="uppercase text-muted-foreground">{key}</div>
										<div className="text-sm">{value as string}</div>
									</div>
								)
							)}
						</div>
					</div>
				)}

				{/* Acciones */}
				<motion.div
					className="absolute top-2 right-2 flex gap-1 z-20"
					initial={{ opacity: 0 }}
					animate={{ opacity: isHovered ? 1 : 0 }}
				>
					{onEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-background/80 backdrop-blur-xs"
							onClick={() => onEdit(character)}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-background/80 backdrop-blur-xs text-destructive"
							onClick={() => onDelete(character.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</motion.div>

				{/* Contador de imágenes */}
				{character._count?.images !== undefined && (
					<div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 backdrop-blur-xs rounded-full px-2 py-0.5 z-10">
						{character._count.images}{" "}
						{character._count.images === 1 ? "imagen" : "imágenes"}
					</div>
				)}
			</div>
		</motion.div>
	);
}
