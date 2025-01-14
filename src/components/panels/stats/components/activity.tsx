"use client";

import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityProps {
	activity: {
		id: string;
		type: string;
		description: string;
		createdAt: Date;
		image: {
			id: string;
			name: string;
			thumbnail: Uint8Array | null;
		} | null;
	};
}

export const Activity = memo(function Activity({ activity }: ActivityProps) {
	return (
		<div className="flex items-center justify-between py-1.5">
			<div className="flex items-center gap-2">
				<Avatar className="h-8 w-8">
					{activity.image?.thumbnail && (
						<AvatarImage
							src={`data:image/jpeg;base64,${Buffer.from(
								activity.image.thumbnail
							).toString("base64")}`}
							alt={activity.image.name}
						/>
					)}
					<AvatarFallback>
						{activity.image?.name.charAt(0).toUpperCase() || "?"}
					</AvatarFallback>
				</Avatar>
				<div className="space-y-1">
					<p className="text-sm">{activity.description}</p>
					<p className="text-xs text-muted-foreground">
						{formatDistanceToNow(new Date(activity.createdAt), {
							addSuffix: true,
							locale: es,
						})}
					</p>
				</div>
			</div>
		</div>
	);
});

Activity.displayName = "Activity";
