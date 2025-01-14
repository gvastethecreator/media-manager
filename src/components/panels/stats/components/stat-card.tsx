"use client";

import { memo } from "react";
import {
	Activity,
	Album,
	Bookmark,
	Box,
	Download,
	Eye,
	Folder,
	HardDrive,
	Image,
	MapPin,
	Star,
	Tag,
	Users,
	type LucideIcon,
} from "lucide-react";

const ICONS = {
	Activity,
	Album,
	Bookmark,
	Box,
	Download,
	Eye,
	Folder,
	HardDrive,
	Image,
	MapPin,
	Star,
	Tag,
	Users,
} as const;

interface StatCardProps {
	title: string;
	value: number | string;
	icon: keyof typeof ICONS;
	color: string;
}

export const StatCard = memo(function StatCard({
	title,
	value,
	icon,
	color,
}: StatCardProps) {
	const Icon = ICONS[icon];

	return (
		<div className="flex items-center justify-between p-2 rounded-lg border bg-card text-card-foreground shadow-sm">
			<div className="flex items-center gap-2">
				<Icon className={`h-4 w-4 ${color}`} />
				<span className="text-sm font-medium">{title}</span>
			</div>
			<span className="text-sm font-medium">{value}</span>
		</div>
	);
});

StatCard.displayName = "StatCard";
