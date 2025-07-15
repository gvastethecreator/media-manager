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
} from 'lucide-react';
import { memo } from 'react';

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

export const StatCard = memo(function StatCard({ title, value, icon, color }: StatCardProps) {
	const Icon = ICONS[icon];

	return (
		<div className="flex items-center justify-between py-1.5 px-2 rounded-md border bg-card/50 text-card-foreground">
			<div className="flex items-center gap-1.5">
				<Icon className={`h-3 w-3 ${color}`} />
				<span className="text-xs">{title}</span>
			</div>
			<span className="text-xs font-medium ml-1">{value}</span>
		</div>
	);
});

StatCard.displayName = 'StatCard';
