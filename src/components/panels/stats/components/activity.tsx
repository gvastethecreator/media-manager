'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { memo } from 'react';

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
		<div className="flex items-center py-1 border-b border-border/40 last:border-0">
			<div className="flex items-center gap-1.5">
				<Avatar className="h-6 w-6">
					{activity.image?.thumbnail && (
						<AvatarImage
							src={`data:image/jpeg;base64,${Buffer.from(activity.image.thumbnail).toString('base64')}`}
							alt={activity.image.name}
						/>
					)}
					<AvatarFallback className="text-[10px]">{activity.image?.name.charAt(0).toUpperCase() || '?'}</AvatarFallback>
				</Avatar>
				<div className="space-y-0.5">
					<p className="text-xs line-clamp-1">{activity.description}</p>
					<p className="text-[10px] text-muted-foreground">
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

Activity.displayName = 'Activity';
