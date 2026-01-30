interface MiniDashboardProps {
	title: string;
	items: {
		label: string;
		value: number | string;
	}[];
}

export function MiniDashboard({ title, items }: MiniDashboardProps) {
	return (
		<div className="rounded-lg border bg-card text-card-foreground shadow-xs">
			<div className="p-4">
				<h3 className="font-semibold text-sm leading-none tracking-tight">{title}</h3>
				<div className="mt-4 grid grid-cols-2 gap-4">
					{items.map((item) => (
						<div className="space-y-1" key={item.label}>
							<p className="text-muted-foreground text-xs">{item.label}</p>
							<p className="font-semibold text-lg">{item.value}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
