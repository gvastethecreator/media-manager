"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
	icon: LucideIcon;
	label: string;
	count?: number;
	isActive?: boolean;
	onClick?: () => void;
	className?: string;
}

export function SidebarItem({
	icon: Icon,
	label,
	count,
	isActive,
	onClick,
	className,
}: SidebarItemProps) {
	return (
		<Button
			variant={isActive ? "default" : "ghost"}
			className={cn(
				"w-full justify-start gap-2 h-8 text-sm px-2",
				isActive && "bg-accent",
				className
			)}
			onClick={onClick}
		>
			<Icon className="h-4 w-4" />
			<span className="flex-1 text-left truncate">{label}</span>
			{typeof count === "number" && (
				<Badge variant="secondary" className="ml-2">
					{count}
				</Badge>
			)}
		</Button>
	);
}
