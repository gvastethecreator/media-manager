import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

interface DebugNavItem {
	title: string;
	href: string;
	description: string;
}

const navItems: DebugNavItem[] = [
	{
		title: 'Consola de Logs',
		href: '/debug',
		description: 'Visualización y captura de logs en tiempo real',
	},
	{
		title: 'Server Actions',
		href: '/debug/actions',
		description: 'Prueba de Server Actions con logging mejorado',
	},
	{
		title: 'API Logger',
		href: '/debug/api',
		description: 'Prueba del sistema de logging para rutas API',
	},
];

export function DebugNav() {
	const location = useLocation();
	const pathname = location.pathname;

	return (
		<div className="flex flex-col space-y-1">
			<div className="px-3 py-2">
				<h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Herramientas de Depuración</h2>
				<div className="space-y-1">
					{navItems.map((item) => (
						<Link
							key={item.href}
							to={item.href}
							className={cn(
								'flex flex-col items-start gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
								pathname === item.href && 'bg-accent text-accent-foreground'
							)}
						>
							<span>{item.title}</span>
							<span className="text-xs text-muted-foreground line-clamp-1">{item.description}</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
