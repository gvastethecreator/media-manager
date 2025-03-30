import { cn } from '@/lib/utils';
import type { GroupCount } from '@/types/entities/group/types';

interface GroupStatsProps {
	count: GroupCount;
}

export function GroupStats({ count }: GroupStatsProps) {
	const total = Object.values(count).reduce((acc, curr) => acc + curr, 0);

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium">Estadísticas</h3>
			<div className="grid grid-cols-2 gap-2">
				{Object.entries(count).map(([key, value]) => (
					<div
						key={key}
						className={cn(
							'flex items-center justify-between p-2 rounded-md',
							'bg-muted/50 hover:bg-muted/70 transition-colors'
						)}
					>
						<span className="text-sm capitalize">{key}</span>
						<span className="text-sm font-medium">{value}</span>
					</div>
				))}
				<div className="col-span-2 flex items-center justify-between p-2 rounded-md bg-primary/10">
					<span className="text-sm font-medium">Total</span>
					<span className="text-sm font-medium">{total}</span>
				</div>
			</div>
		</div>
	);
}