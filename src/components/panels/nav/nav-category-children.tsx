"use client";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/utils";
import type { ViewType } from "@/types/file-item";
import {
	BookImage,
	CornerDownRight,
	FolderIcon,
	ImageIcon,
	TagIcon,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useState } from "react";

export type CategoryChild = {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	path?: string;
	description?: string;
	_count?: { images: number };
};

interface NavCategoryChildrenProps {
	categoryId: ViewType;
	isCollapsed: boolean;
	selectedChildId: string | null;
	currentView: string;
	items: CategoryChild[];
	onItemClick: (id: string) => void;
}

export function NavCategoryChildren({
	categoryId,
	isCollapsed,
	selectedChildId,
	currentView,
	items,
	onItemClick,
}: NavCategoryChildrenProps) {
	if (items.length === 0) {
		return (
			<div className="px-0 py-1 text-[10px] text-muted-foreground italic">
				No hay elementos
			</div>
		);
	}

	// Renderizar elementos especiales para etiquetas
	if (categoryId === "tags") {
		if (isCollapsed) {
			return null;
		}

		return (
			<div className="flex w-full flex-wrap gap-1 ml-1 mt-1 mb-1">
				{items.map((tag) => (
					<TooltipProvider key={tag.id} delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									className={cn(
										"h-5 px-2 text-[10px] transition-all duration-150 rounded-none text-foreground font-medium nav-tag cursor-pointer",
										currentView === "tag-content" &&
											selectedChildId === tag.name &&
											"ring-1 ring-primary/30",
										"hover:brightness-110"
									)}
									style={{ backgroundColor: tag.color || "#888" }}
									onClick={() => onItemClick(tag.name)}
								>
									<span className="truncate">#{tag.name}</span>
									{tag._count && tag._count.images > 0 && (
										<span className="ml-1 px-1 py-0 bg-black/30 rounded-sm text-[8px]">
											{tag._count.images}
										</span>
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent
								side="right"
								className="text-xs tooltip-with-info"
							>
								<p>{tag._count?.images || 0} imágenes con esta etiqueta</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				))}
			</div>
		);
	}

	// Renderizar elementos normales
	return (
		<motion.div
			animate={{
				height: isCollapsed ? 0 : "auto",
				opacity: isCollapsed ? 0 : 1,
			}}
			initial={false}
			transition={{ duration: 0.2 }}
			className={cn(
				"overflow-hidden transition-all duration-200",
				isCollapsed && "hidden"
			)}
		>
			{items.map((item) => {
				const isSelected =
					selectedChildId === item.id &&
					currentView === `${categoryId.replace(/s$/, "")}-content`;

				return (
					<TooltipProvider key={item.id} delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className={cn(
										"group relative w-full justify-start rounded-none text-xs font-normal transition-all cursor-pointer",
										"h-7 px-7 py-0 hover:bg-gray-100/10",
										isSelected && "bg-gray-100/5 font-medium text-foreground",
										"nav-item-button"
									)}
									onClick={() => onItemClick(item.id)}
								>
									<div className="flex items-center space-x-1.5 overflow-hidden">
										{item.emoji && (
											<span className="text-xs shrink-0">{item.emoji}</span>
										)}
										<span className="truncate max-w-[150px]">{item.name}</span>
									</div>

									{/* Información inline */}
									<div className="flex items-center ml-auto gap-1.5">
										{/* Descripción inline si existe */}
										{item.description && (
											<span className="text-[9px] text-muted-foreground truncate max-w-[80px] italic">
												{item.description}
											</span>
										)}

										{/* Ruta para carpetas */}
										{item.path && categoryId === "folders" && (
											<span className="text-[9px] text-muted-foreground/70 truncate max-w-[60px]">
												{item.path.split("/").pop()}
											</span>
										)}

										{/* Contador de imágenes */}
										{item._count && item._count.images > 0 && (
											<div className="inline-flex items-center space-x-0.5 px-1 rounded-sm text-muted-foreground text-[9px] bg-secondary/30 nav-count-badge">
												<ImageIcon className="h-2.5 w-2.5" />
												<span>{item._count.images}</span>
											</div>
										)}
									</div>
								</Button>
							</TooltipTrigger>
							<TooltipContent
								side="right"
								className="text-xs tooltip-with-info"
							>
								{item.path && (
									<p className="text-muted-foreground text-[10px]">
										{item.path}
									</p>
								)}
								{item.description && <p>{item.description}</p>}
								<p>{item._count?.images || 0} imágenes</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				);
			})}
		</motion.div>
	);
}
