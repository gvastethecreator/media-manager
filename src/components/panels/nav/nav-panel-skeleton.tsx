import { Skeleton } from '@/components/ui/skeleton';

export function NavPanelSkeleton() {
	return (
		<div className="flex flex-col h-full">
			<div className="flex flex-col bg-primary/10 py-2">
				<div className="flex items-center justify-between gap-2">
					<div className="flex gap-2 items-center px-2">
						<Skeleton className="h-8 w-8 rounded-sm" />
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-16" />
						</div>
					</div>
					<div className="gap-8 pr-2">
						<Skeleton className="h-8 w-8 rounded-sm" />
						<Skeleton className="h-8 w-8 rounded-sm" />
						<Skeleton className="h-8 w-8 rounded-sm" />
					</div>
				</div>
			</div>

			<div className="p-2">
				<div className="flex justify-between gap-1">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-7 flex-1" />
					))}
				</div>

				<div className="mt-1">
					{[1, 2, 3, 4, 5, 6, 7].map((i) => (
						<div key={i} className="mt-1">
							<Skeleton className="h-8 w-full mt-2" />
							<div className="mt-1 flex flex-col gap-1">
								{[1, 2, 3].map((j) => (
									<Skeleton key={j} className="h-6 w-full" />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
