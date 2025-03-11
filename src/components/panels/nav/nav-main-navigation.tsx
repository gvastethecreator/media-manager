"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import type { ViewType } from "@/types/file-item";
import {
	BookImage,
	Image as ImageIcon,
	Search,
	Star,
	UploadCloud,
} from "lucide-react";
import { motion } from "motion/react";

interface NavMainNavigationProps {
	currentView: string;
	onNavigate: (id: ViewType) => void;
}

const navigationItems = [
	{ id: "all-images" as ViewType, label: "Galería", icon: ImageIcon },
	{
		id: "uploaded-images" as ViewType,
		label: "Subidas",
		icon: UploadCloud,
	},
	{ id: "favorites" as ViewType, label: "Favoritos", icon: Star },
	{ id: "search" as ViewType, label: "Buscar", icon: Search },
];

export function NavMainNavigation({
	currentView,
	onNavigate,
}: NavMainNavigationProps) {
	return (
		<motion.div
			initial={{ y: -5, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.15 }}
			className="flex justify-between gap-0"
		>
			{navigationItems.map(({ id, icon: Icon, label }, index) => (
				<motion.div
					key={id}
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.03, duration: 0.15 }}
					className="flex-1"
					whileHover={{ y: -2 }}
					whileTap={{ y: 0 }}
				>
					<Button
						variant={currentView === id ? "default" : "outline"}
						className={cn(
							"gap-1 h-6 px-2 transition-all duration-150 rounded-none w-full cursor-pointer",
							currentView === id
								? "bg-primary/80 hover:bg-primary text-primary-foreground shadow-sm"
								: "hover:bg-secondary/20 border-secondary/20"
						)}
						onClick={() => onNavigate(id)}
					>
						<span className="truncate flex items-center justify-center text-xs">
							<Icon className="h-3 w-3 mr-1" />
							<span className="truncate">{label}</span>
						</span>
					</Button>
				</motion.div>
			))}
		</motion.div>
	);
}
