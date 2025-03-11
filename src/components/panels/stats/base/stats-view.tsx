"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Meteors } from "@/components/ui/meteors";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils/utils";
import type React from "react";

interface StatsViewProps {
	icon?: React.ReactNode;
	title: string;
	subtitle?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

export function StatsView({
	icon,
	title,
	subtitle,
	children,
	className,
}: StatsViewProps) {
	return (
		<div className="space-y-4 p-2">
			{/* Encabezado */}
			<div className="flex items-center gap-2">
				{icon && (
					<div className="h-8 w-8 rounded-sm bg-primary/10 flex items-center justify-center">
						{icon}
					</div>
				)}
				<div className="flex flex-col">
					<h3 className="text-sm font-medium">{title}</h3>
					{subtitle && (
						<div className="text-xs text-muted-foreground">{subtitle}</div>
					)}
				</div>
			</div>

			{/* Contenido */}
			<Card className={cn("border-none bg-muted/50", className)}>
				<CardContent className="p-4 space-y-3">{children}</CardContent>
			</Card>
		</div>
	);
}

export function StatsContainer({ children }: { children: React.ReactNode }) {
	return (
		<ScrollArea className="h-full w-full p-0">
			<div className="p-0 w-full h-full">
				<Meteors />
				<Card className="border-none rounded-none">
					<CardContent className="p-0">{children}</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}

export function StatCard({
	icon,
	title,
	value,
	className,
}: {
	icon: React.ReactNode;
	title: string;
	value: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<div className="h-8 w-8 rounded-sm bg-muted flex items-center justify-center">
				{icon}
			</div>
			<div className="flex flex-col">
				<span className="text-xs text-muted-foreground">{title}</span>
				<span className="text-sm font-medium">{value}</span>
			</div>
		</div>
	);
}

export function StatProgress({
	title,
	value,
	total,
	progress,
	className,
}: {
	title: string;
	value: number;
	total: number;
	progress: number;
	className?: string;
}) {
	return (
		<div className={cn("space-y-1", className)}>
			<div className="flex items-center justify-between text-xs">
				<span className="text-xs text-muted-foreground">{title}</span>
				<span>
					{value} / {total}
				</span>
			</div>
			<div className="h-1 w-full bg-muted rounded-full overflow-hidden">
				<div
					className="h-full bg-primary transition-all duration-300 ease-in-out"
					style={{ width: `${progress}%` }}
				/>
			</div>
		</div>
	);
}
