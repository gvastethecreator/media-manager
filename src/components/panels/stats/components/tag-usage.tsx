"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface TagUsageProps {
	tag: {
		id: string;
		name: string;
		color: string;
		count: number;
	};
	isLoading?: boolean;
}

export const TagUsage = memo(function TagUsage({
	tag,
	isLoading = false,
}: TagUsageProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-between py-1.5 px-2">
				<Skeleton className="h-5 w-24" />
				<Skeleton className="h-5 w-12" />
			</div>
		);
	}

	const percentage = Math.min(100, (tag.count / 100) * 100);

	return (
		<div className="flex items-center justify-between py-1.5 px-2 rounded-sm hover:bg-muted/50 transition-colors">
			<div className="flex items-center gap-2 min-w-0">
				<Badge
					variant="outline"
					style={{ borderColor: tag.color, color: tag.color }}
				>
					{tag.name}
				</Badge>
			</div>
			<div className="flex items-center gap-2">
				<div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-primary rounded-full transition-all"
						style={{ width: `${percentage}%` }}
					/>
				</div>
				<span className="text-sm text-muted-foreground min-w-[2.5rem] text-right">
					{tag.count}
				</span>
			</div>
		</div>
	);
});

TagUsage.displayName = "TagUsage";
