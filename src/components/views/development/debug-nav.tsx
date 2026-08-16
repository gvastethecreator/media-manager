import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DebugNavItem {
	description: string;
	href: string;
	title: string;
}

const navItems: DebugNavItem[] = [
	{
		title: 'Log Console',
		href: '/debug',
		description: 'View and capture logs in real time',
	},
	{
		title: 'Server Actions',
		href: '/debug/actions',
		description: 'Test Server Actions with enhanced logging',
	},
	{
		title: 'API Logger',
		href: '/debug/api',
		description: 'Test logging for API routes',
	},
];

export function DebugNav() {
	const location = useLocation();
	const pathname = location.pathname;

	return (
		<div className="flex flex-col space-y-1">
			<div className="px-3 py-2">
				<h2 className="mb-2 px-4 font-semibold text-lg tracking-tight">Debug Tools</h2>
				<div className="space-y-1">
					{navItems.map((item) => (
						<Link
							className={cn(
								'flex flex-col items-start gap-1 rounded-md px-3 py-2 font-medium text-sm hover:bg-accent hover:text-accent-foreground',
								pathname === item.href && 'bg-accent text-accent-foreground'
							)}
							key={item.href}
							to={item.href}
						>
							<span>{item.title}</span>
							<span className="line-clamp-1 text-muted-foreground text-xs">{item.description}</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
