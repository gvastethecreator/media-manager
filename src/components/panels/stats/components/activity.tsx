"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/core/icons";

interface ActivityProps {
	activity: {
		id: string;
		type: string;
		description: string;
		timestamp: Date;
	};
	isLoading?: boolean;
}

export const Activity = memo(function Activity({
	activity,
	isLoading = false,
}: ActivityProps) {
	if (isLoading) {
		return (
			<div className="flex items-center gap-3 py-1.5 px-2">
				<Skeleton className="h-8 w-8 rounded-full" />
				<div className="space-y-1.5 flex-1">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-1/4" />
				</div>
			</div>
		);
	}

	const getIcon = (type: string) => {
		switch (type) {
			case "view":
				return "Eye";
			case "download":
				return "Download";
			case "favorite":
				return "Star";
			case "tag":
				return "Tag";
			case "collection":
				return "Bookmark";
			case "album":
				return "Album";
			default:
				return "Activity";
		}
	};

	const Icon = Icons[getIcon(activity.type)];
	const timeAgo = new Date(activity.timestamp).toLocaleDateString();

	return (
		<div className="flex items-center gap-3 py-1.5 px-2 rounded-sm hover:bg-muted/50 transition-colors">
			<div className="p-2 rounded-full bg-primary/10">
				<Icon className="h-4 w-4 text-primary" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm line-clamp-1">{activity.description}</p>
				<p className="text-xs text-muted-foreground">{timeAgo}</p>
			</div>
		</div>
	);
});

Activity.displayName = "Activity";
