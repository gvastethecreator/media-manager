"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/core/icons";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
	title: string;
	value: number | string;
	icon: keyof typeof Icons;
	color?: string;
	isLoading?: boolean;
}

export const StatCard = memo(function StatCard({
	title,
	value,
	icon,
	color = "text-primary",
	isLoading = false,
}: StatCardProps) {
	const Icon = Icons[icon];

	if (isLoading) {
		return (
			<Card className="w-full h-full">
				<CardContent className="p-4">
					<div className="flex items-center gap-4">
						<Skeleton className="h-10 w-10 rounded-md" />
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-16" />
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full h-full">
			<CardContent className="p-4">
				<div className="flex items-center gap-4">
					<div className={cn("p-2 rounded-md bg-primary/10", color)}>
						<Icon className="h-6 w-6" />
					</div>
					<div>
						<p className="text-sm text-muted-foreground">{title}</p>
						<p className="text-2xl font-semibold">{value}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});

StatCard.displayName = "StatCard";
