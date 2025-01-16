"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
	Target,
	Sparkles,
	Scroll,
	PencilIcon,
	Trash2,
	Image as ImageIcon,
	Clock,
	Gem,
	ScrollText,
	Swords,
	Shield,
	Crown,
	Cog,
	Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Object } from "@prisma/client";
import { formatBytes, formatDate } from "@/lib/utils";

interface ObjectCardProps {
	object: Object & {
		_count?: { images: number };
		totalSize?: number;
		featuredImage?: string | null;
		recentImages?: (string | null)[];
	};
	onEdit?: (object: Object) => void;
	onDelete?: (id: string) => void;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
}

const getRarityGradient = (rarity: string) => {
	const gradients = {
		Común: "from-zinc-500/20 via-slate-400/20 to-zinc-500/20",
		Poco_común: "from-emerald-500/20 via-green-400/20 to-emerald-500/20",
		Raro: "from-blue-500/20 via-indigo-400/20 to-blue-500/20",
		Muy_raro: "from-violet-500/20 via-purple-400/20 to-violet-500/20",
		Legendario: "from-amber-500/20 via-yellow-400/20 to-amber-500/20",
		Mítico: "from-rose-500/20 via-red-400/20 to-rose-500/20",
		default: "from-zinc-500/20 via-slate-400/20 to-zinc-500/20",
	};
	return (
		gradients[rarity.replace(" ", "_") as keyof typeof gradients] ||
		gradients.default
	);
};

const getTypeIcon = (type: string) => {
	switch (type.toLowerCase()) {
		case "arma":
			return Swords;
		case "armadura":
			return Shield;
		case "accesorio":
			return Crown;
		case "poción":
			return Sparkles;
		case "pergamino":
			return ScrollText;
		case "gema":
			return Gem;
		default:
			return Target;
	}
};

export function ObjectCard({
	object,
	onEdit,
	onDelete,
	onClick,
	className,
}: ObjectCardProps) {
	const [isHovered, setIsHovered] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
	const [rotation, setRotation] = React.useState({ main: 0, secondary: 0 });
	const cardRef = React.useRef<HTMLDivElement>(null);
	const rarityGradient = getRarityGradient(object.rarity);
	const TypeIcon = getTypeIcon(object.type);

	// Manejar el movimiento del mouse para efectos metálicos
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!cardRef.current) return;
		const rect = cardRef.current.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

	// Efecto de rotación de engranajes
	React.useEffect(() => {
		let animationFrame: number;
		const animate = () => {
			setRotation((prev) => ({
				main: (prev.main + 0.2) % 360,
				secondary: (prev.secondary - 0.3) % 360,
			}));
			animationFrame = requestAnimationFrame(animate);
		};
		if (isHovered) {
			animate();
		}
		return () => cancelAnimationFrame(animationFrame);
	}, [isHovered]);

	// Parsear propiedades y requisitos
	const properties = React.useMemo(() => {
		try {
			return JSON.parse(object.properties);
		} catch {
			return [];
		}
	}, [object.properties]);

	const requirements = React.useMemo(() => {
		try {
			return JSON.parse(object.requirements);
		} catch {
			return {};
		}
	}, [object.requirements]);

	// Manejadores de eventos
	const handleEdit = React.useCallback(() => {
		onEdit?.(object);
	}, [onEdit, object]);

	const handleDelete = React.useCallback(() => {
		onDelete?.(object.id);
	}, [onDelete, object.id]);

	return (
		<motion.div
			ref={cardRef}
			className={cn(
				"relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden group",
				"bg-gradient-to-br from-zinc-900 to-stone-800",
				"shadow-lg hover:shadow-xl transition-all duration-300",
				"cursor-pointer perspective-1000",
				className
			)}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			onMouseMove={handleMouseMove}
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.2 }}
			onClick={onClick}
			style={
				{
					"--x": `${mousePosition.x}%`,
					"--y": `${mousePosition.y}%`,
				} as React.CSSProperties
			}
		>
			{/* Fondo metálico con efecto de pulido */}
			<div
				className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-300"
				style={{
					backgroundImage: `
						radial-gradient(
							circle at var(--x) var(--y),
							${object.color}44,
							transparent 50%
						),
						linear-gradient(
							${135 + (mousePosition.x / 100) * 90}deg,
							transparent,
							${object.color}22,
							transparent
						)
					`,
					backgroundSize: "200% 200%, 200% 200%",
					backgroundPosition: "var(--x) var(--y), var(--x) var(--y)",
				}}
			/>

			{/* Patrón de engranajes */}
			<div className="absolute inset-0">
				{/* Engranaje principal */}
				<div
					className="absolute -top-16 -right-16 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
					style={{
						backgroundImage: `conic-gradient(
							from ${rotation.main}deg at center,
							${object.color}22,
							transparent 60deg,
							${object.color}22 120deg,
							transparent 180deg,
							${object.color}22 240deg,
							transparent 300deg,
							${object.color}22 360deg
						)`,
						WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9.8-.8l-1.9.5a7 7 0 0 1-.6 1.5l1.2 1.5a1 1 0 0 1-.1 1.4l-1.4 1.4a1 1 0 0 1-1.4.1l-1.5-1.2a7 7 0 0 1-1.5.6l-.5 1.9a1 1 0 0 1-1 .8h-2a1 1 0 0 1-1-.8l-.5-1.9a7 7 0 0 1-1.5-.6l-1.5 1.2a1 1 0 0 1-1.4-.1l-1.4-1.4a1 1 0 0 1-.1-1.4l1.2-1.5a7 7 0 0 1-.6-1.5L2.2 12a1 1 0 0 1-.8-1v-2a1 1 0 0 1 .8-1l1.9-.5a7 7 0 0 1 .6-1.5L3.5 4.6a1 1 0 0 1 .1-1.4l1.4-1.4a1 1 0 0 1 1.4-.1l1.5 1.2a7 7 0 0 1 1.5-.6l.5-1.9A1 1 0 0 1 11 0h2a1 1 0 0 1 1 .8l.5 1.9a7 7 0 0 1 1.5.6l1.5-1.2a1 1 0 0 1 1.4.1l1.4 1.4a1 1 0 0 1 .1 1.4l-1.2 1.5a7 7 0 0 1 .6 1.5l1.9.5a1 1 0 0 1 .8 1v2a1 1 0 0 1-.8 1z'/%3E%3C/svg%3E")`,
						maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9.8-.8l-1.9.5a7 7 0 0 1-.6 1.5l1.2 1.5a1 1 0 0 1-.1 1.4l-1.4 1.4a1 1 0 0 1-1.4.1l-1.5-1.2a7 7 0 0 1-1.5.6l-.5 1.9a1 1 0 0 1-1 .8h-2a1 1 0 0 1-1-.8l-.5-1.9a7 7 0 0 1-1.5-.6l-1.5 1.2a1 1 0 0 1-1.4-.1l-1.4-1.4a1 1 0 0 1-.1-1.4l1.2-1.5a7 7 0 0 1-.6-1.5L2.2 12a1 1 0 0 1-.8-1v-2a1 1 0 0 1 .8-1l1.9-.5a7 7 0 0 1 .6-1.5L3.5 4.6a1 1 0 0 1 .1-1.4l1.4-1.4a1 1 0 0 1 1.4-.1l1.5 1.2a7 7 0 0 1 1.5-.6l.5-1.9A1 1 0 0 1 11 0h2a1 1 0 0 1 1 .8l.5 1.9a7 7 0 0 1 1.5.6l1.5-1.2a1 1 0 0 1 1.4.1l1.4 1.4a1 1 0 0 1 .1 1.4l-1.2 1.5a7 7 0 0 1 .6 1.5l1.9.5a1 1 0 0 1 .8 1v2a1 1 0 0 1-.8 1z'/%3E%3C/svg%3E")`,
						transform: `rotate(${rotation.main}deg)`,
					}}
				/>

				{/* Engranaje secundario */}
				<div
					className="absolute -bottom-8 -left-8 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
					style={{
						backgroundImage: `conic-gradient(
							from ${rotation.secondary}deg at center,
							${object.color}22,
							transparent 60deg,
							${object.color}22 120deg,
							transparent 180deg,
							${object.color}22 240deg,
							transparent 300deg,
							${object.color}22 360deg
						)`,
						WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9.8-.8l-1.9.5a7 7 0 0 1-.6 1.5l1.2 1.5a1 1 0 0 1-.1 1.4l-1.4 1.4a1 1 0 0 1-1.4.1l-1.5-1.2a7 7 0 0 1-1.5.6l-.5 1.9a1 1 0 0 1-1 .8h-2a1 1 0 0 1-1-.8l-.5-1.9a7 7 0 0 1-1.5-.6l-1.5 1.2a1 1 0 0 1-1.4-.1l-1.4-1.4a1 1 0 0 1-.1-1.4l1.2-1.5a7 7 0 0 1-.6-1.5L2.2 12a1 1 0 0 1-.8-1v-2a1 1 0 0 1 .8-1l1.9-.5a7 7 0 0 1 .6-1.5L3.5 4.6a1 1 0 0 1 .1-1.4l1.4-1.4a1 1 0 0 1 1.4-.1l1.5 1.2a7 7 0 0 1 1.5-.6l.5-1.9A1 1 0 0 1 11 0h2a1 1 0 0 1 1 .8l.5 1.9a7 7 0 0 1 1.5.6l1.5-1.2a1 1 0 0 1 1.4.1l1.4 1.4a1 1 0 0 1 .1 1.4l-1.2 1.5a7 7 0 0 1 .6 1.5l1.9.5a1 1 0 0 1 .8 1v2a1 1 0 0 1-.8 1z'/%3E%3C/svg%3E")`,
						maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9.8-.8l-1.9.5a7 7 0 0 1-.6 1.5l1.2 1.5a1 1 0 0 1-.1 1.4l-1.4 1.4a1 1 0 0 1-1.4.1l-1.5-1.2a7 7 0 0 1-1.5.6l-.5 1.9a1 1 0 0 1-1 .8h-2a1 1 0 0 1-1-.8l-.5-1.9a7 7 0 0 1-1.5-.6l-1.5 1.2a1 1 0 0 1-1.4-.1l-1.4-1.4a1 1 0 0 1-.1-1.4l1.2-1.5a7 7 0 0 1-.6-1.5L2.2 12a1 1 0 0 1-.8-1v-2a1 1 0 0 1 .8-1l1.9-.5a7 7 0 0 1 .6-1.5L3.5 4.6a1 1 0 0 1 .1-1.4l1.4-1.4a1 1 0 0 1 1.4-.1l1.5 1.2a7 7 0 0 1 1.5-.6l.5-1.9A1 1 0 0 1 11 0h2a1 1 0 0 1 1 .8l.5 1.9a7 7 0 0 1 1.5.6l1.5-1.2a1 1 0 0 1 1.4.1l1.4 1.4a1 1 0 0 1 .1 1.4l-1.2 1.5a7 7 0 0 1 .6 1.5l1.9.5a1 1 0 0 1 .8 1v2a1 1 0 0 1-.8 1z'/%3E%3C/svg%3E")`,
						transform: `rotate(${rotation.secondary}deg)`,
					}}
				/>
			</div>

			{/* Marco metálico */}
			<div
				className="absolute inset-[2px] rounded-lg border-2 transition-all duration-300"
				style={{
					borderImage: `linear-gradient(
						${45 + (mousePosition.x / 100) * 90}deg,
						${object.color}88,
						transparent,
						${object.color}88
					) 1`,
					boxShadow: `
						inset 0 0 20px ${object.color}22,
						0 0 10px ${object.color}22
					`,
				}}
			/>

			{/* Contenido de la carta */}
			<div className="relative h-full p-4 flex flex-col backdrop-blur-sm">
				{/* Encabezado con tipo y rareza */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"h-12 w-12 rounded-lg flex items-center justify-center",
								"bg-gradient-to-br shadow-inner relative overflow-hidden",
								rarityGradient
							)}
							style={{
								border: `2px solid ${object.color}88`,
								boxShadow: `inset 0 2px 4px ${object.color}22`,
							}}
						>
							<span className="text-2xl filter drop-shadow relative z-10">
								{object.emoji}
							</span>
							{/* Destello del emoji */}
							<div
								className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
								style={{
									background: `linear-gradient(
										${45 + (mousePosition.x / 100) * 90}deg,
										transparent,
										${object.color}88,
										transparent
									)`,
								}}
							/>
						</div>
						<div>
							<h3 className="font-bold text-lg leading-tight text-zinc-100">
								{object.name}
							</h3>
							<div className="flex items-center gap-1 text-sm text-zinc-400">
								<TypeIcon className="h-3 w-3" />
								<span>{object.type}</span>
								<span className="mx-1">•</span>
								<Sparkles className="h-3 w-3" />
								<span>{object.rarity}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Descripción */}
				{object.description && (
					<div className="mb-4">
						<p className="text-sm text-zinc-400 line-clamp-2">
							{object.description}
						</p>
					</div>
				)}

				{/* Propiedades */}
				{properties.length > 0 && (
					<div className="flex-1 overflow-hidden">
						<div className="flex items-center gap-2 mb-2">
							<Gauge className="h-4 w-4" style={{ color: object.color }} />
							<span className="text-sm font-medium text-zinc-300">
								Propiedades
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							{properties.map((prop: string, index: number) => (
								<div
									key={index}
									className={cn(
										"text-xs px-2 py-1 rounded relative overflow-hidden",
										"bg-zinc-900/50 backdrop-blur-sm",
										rarityGradient
									)}
								>
									<span className="relative z-10 text-zinc-300">{prop}</span>
									{/* Destello de propiedad */}
									<div
										className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
										style={{
											background: `linear-gradient(
												${45 + (mousePosition.x / 100) * 90}deg,
												transparent,
												${object.color}44,
												transparent
											)`,
										}}
									/>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Requisitos */}
				{Object.keys(requirements).length > 0 && (
					<div className="mt-4">
						<div className="flex items-center gap-2 mb-2">
							<Shield className="h-4 w-4" style={{ color: object.color }} />
							<span className="text-sm font-medium text-zinc-300">
								Requisitos
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							{Object.entries(requirements).map(([key, value]) => (
								<div
									key={key}
									className={cn(
										"flex items-center justify-between px-2 py-1 rounded relative overflow-hidden",
										"bg-zinc-900/50 backdrop-blur-sm",
										rarityGradient
									)}
								>
									<span className="uppercase text-zinc-500 text-xs relative z-10">
										{key}
									</span>
									<span className="text-zinc-300 text-xs relative z-10">
										{value as string}
									</span>
									{/* Destello de requisito */}
									<div
										className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
										style={{
											background: `linear-gradient(
												${45 + (mousePosition.x / 100) * 90}deg,
												transparent,
												${object.color}44,
												transparent
											)`,
										}}
									/>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Origen */}
				{object.origin && (
					<div className="mt-4 bg-zinc-900/50 backdrop-blur-sm rounded-lg p-2">
						<div className="flex items-center gap-2 mb-1">
							<Scroll className="h-4 w-4" style={{ color: object.color }} />
							<span className="text-sm font-medium text-zinc-300">Origen</span>
						</div>
						<p className="text-xs text-zinc-400">{object.origin}</p>
					</div>
				)}

				{/* Acciones */}
				<motion.div
					className="absolute top-2 right-2 flex gap-1"
					initial={{ opacity: 0 }}
					animate={{ opacity: isHovered ? 1 : 0 }}
					onClick={(e: React.MouseEvent) => e.stopPropagation()}
				>
					{onEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-zinc-950/80 backdrop-blur-sm hover:bg-zinc-900/80"
							onClick={handleEdit}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 bg-zinc-950/80 backdrop-blur-sm hover:bg-zinc-900/80 text-destructive"
							onClick={handleDelete}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</motion.div>

				{/* Contador de imágenes */}
				{object._count?.images !== undefined && (
					<div className="absolute bottom-2 right-2 text-[10px] text-zinc-400 bg-zinc-950/80 backdrop-blur-sm rounded-full px-2 py-0.5">
						{object._count.images}{" "}
						{object._count.images === 1 ? "imagen" : "imágenes"}
					</div>
				)}

				{/* Imagen destacada */}
				{object.featuredImage && (
					<div className="absolute inset-0 z-0">
						<div
							className="absolute inset-0 bg-cover bg-center"
							style={{
								backgroundImage: `url(${object.featuredImage})`,
								opacity: 0.15,
								filter: "blur(8px)",
							}}
						/>
						<div className="absolute inset-x-0 top-20 bottom-40 px-4">
							<div className="relative w-full h-full rounded-lg overflow-hidden">
								<img
									src={object.featuredImage}
									alt={object.name}
									className="object-cover w-full h-full"
								/>
								<div
									className="absolute inset-0"
									style={{
										background: `linear-gradient(to bottom,
											transparent 0%,
											${object.color}22 50%,
											${object.color}44 100%
										)`,
									}}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Grid de imágenes recientes */}
				{object.recentImages && object.recentImages.length > 0 && (
					<div className="absolute inset-x-0 bottom-20 h-32 px-4 z-0">
						<div className="grid grid-cols-3 gap-2 h-full">
							{object.recentImages.slice(0, 3).map((src, i) => (
								<div
									key={i}
									className="relative rounded-md overflow-hidden aspect-square"
								>
									{src ?
										<img
											src={src}
											alt={`Imagen ${i + 1}`}
											className="object-cover w-full h-full"
										/>
									:	<div
											className={cn(
												"w-full h-full flex items-center justify-center",
												"bg-gradient-to-br",
												rarityGradient
											)}
										>
											<ImageIcon className="w-4 h-4 text-white/80" />
										</div>
									}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}
