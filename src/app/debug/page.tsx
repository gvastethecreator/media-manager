import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebugConsole } from '@/components/views/development/debug-console';
import { ServerStats } from '@/components/views/development/server-stats';



export default function DebugPage() {
	return (
		<div className="container space-y-6 py-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold">Panel de Depuración</h1>
				<p className="text-muted-foreground">Herramientas para monitorear y depurar la aplicación en tiempo real.</p>
			</div>

			<Tabs defaultValue="console" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="console">Consola de Logs</TabsTrigger>
					<TabsTrigger value="stats">Estadísticas del Servidor</TabsTrigger>
				</TabsList>

				<TabsContent value="console" className="mt-6">
					<DebugConsole />
				</TabsContent>

				<TabsContent value="stats" className="mt-6">
					<ServerStats />
				</TabsContent>
			</Tabs>
		</div>
	);
}
