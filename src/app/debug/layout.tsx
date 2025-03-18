import { Metadata } from 'next';
import { DebugNav } from '@/components/views/development/debug-nav';

export const metadata: Metadata = {
	title: {
		template: '%s | Herramientas de Depuración',
		default: 'Herramientas de Depuración',
	},
	description: 'Herramientas para depuración y monitoreo de la aplicación',
};

interface DebugLayoutProps {
	children: React.ReactNode;
}

export default function DebugLayout({ children }: DebugLayoutProps) {
	return (
		<div className="flex min-h-screen flex-col">
			<div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
				<aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
					<div className="h-full py-6 pr-2 md:py-8">
						<DebugNav />
					</div>
				</aside>
				<main className="flex w-full flex-col overflow-hidden py-6 md:py-8">{children}</main>
			</div>
		</div>
	);
}
