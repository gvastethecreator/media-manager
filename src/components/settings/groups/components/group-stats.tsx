import { cn } from '@/lib/utils';

// Definir tipo local
interface GroupCount {
	[key: string]: number;
}

interface GroupStatsProps {
	count: GroupCount;
}

export function GroupStats({ count }: GroupStatsProps) {
	const total = Object.values(count).reduce((acc: number, curr: number) => acc + curr, 0);

	return (
		<div className="space-y-2">
			<h3 className="font-medium text-sm">Estadísticas</h3>
			<div className="grid grid-cols-2 gap-2">
				{Object.entries(count).map(([key, value]: [string, number]) => (
					<div
						className={cn(
							'flex items-center justify-between rounded-md p-2',
							'bg-muted/50 transition-colors hover:bg-muted/70'
						)}
						key={key}
					>
						<span className="text-sm capitalize">{key}</span>
						<span className="font-medium text-sm">{value}</span>
					</div>
				))}
				<div className="col-span-2 flex items-center justify-between rounded-md bg-primary/10 p-2">
					<span className="font-medium text-sm">Total</span>
					<span className="font-medium text-sm">{total}</span>
				</div>
			</div>
		</div>
	);
}
