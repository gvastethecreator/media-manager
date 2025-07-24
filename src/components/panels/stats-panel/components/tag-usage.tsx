import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

interface TagUsageProps {
	tag: {
		id: string;
		name: string;
		color?: string;
		count: number;
	};
}

export const TagUsage = memo(function TagUsage({ tag }: TagUsageProps) {
	const percentage = Math.min(100, (tag.count / 100) * 100);
	const tagColor = tag.color || '#6b7280'; // Color por defecto si no está definido

	return (
		<div className="flex items-center justify-between py-1 px-1.5 rounded-sm hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-1.5 min-w-0">
				<Badge
					variant="outline"
					className="px-1.5 py-0 h-auto text-[10px]"
					style={{ borderColor: tagColor, color: tagColor }}
				>
					{tag.name}
				</Badge>
			</div>
			<div className="flex items-center gap-1.5">
				<div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
					<div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
				</div>
				<span className="text-[10px] text-muted-foreground min-w-[1.75rem] text-right">{tag.count}</span>
			</div>
		</div>
	);
});

TagUsage.displayName = 'TagUsage';
