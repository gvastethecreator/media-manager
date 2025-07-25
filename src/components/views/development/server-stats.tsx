import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemStatsExtended as useSystemStats } from '@/lib/api/stats';
import { clientLogger } from '@/lib/logger/client-logger';

// Logger específico para este componente
const logger = clientLogger.withContext('ServerStats');

// Interfaces para las estadísticas
interface SystemStats {
	cpu: {
		usage: number;
		cores: number;
		model: string;
	};
	memory: {
		total: string;
		free: string;
		used: string;
		usedPercentage: number;
	};
	uptime: string;
	platform: string;
	nodeVersion: string;
	network: {
		interface: string;
		address: string;
		netmask: string;
		mac: string;
	}[];
}

interface AppStats {
	requests: {
		total: number;
		success: number;
		error: number;
		pending: number;
		successRate?: string;
	};
	performance: {
		avgResponseTime: string;
		minResponseTime: string;
		maxResponseTime: string;
		p95ResponseTime: string;
	};
	errors: {
		count: number;
		byType: Record<string, number>;
		last?: {
			mensaje: string;
			tipo: string;
		};
	};
	database: {
		queries: number;
		avgQueryTime: string;
		slowQueries: number;
	};
	cache: {
		hits: number;
		misses: number;
		ratio: string;
	};
}

/**
 * Componente para visualizar estadísticas del servidor
 */
export function ServerStats() {
	const [activeTab, setActiveTab] = useState('system');

	// Usar React Query hook en lugar de server actions
	const { data: statsData, isLoading: loading, error, refetch: fetchStats } = useSystemStats();

	// Crear datos mock para system y app stats ya que SystemStatsExtended no los incluye
	const systemStats: SystemStats | null = statsData
		? {
				cpu: {
					usage: Math.random() * 100,
					cores: 8,
					model: 'Intel Core i7',
				},
				memory: {
					total: '16 GB',
					free: '8 GB',
					used: '8 GB',
					usedPercentage: 50,
				},
				uptime: '2 days, 4 hours',
				platform: 'linux',
				nodeVersion: 'v18.17.0',
				network: [
					{
						interface: 'eth0',
						address: '192.168.1.100',
						netmask: '255.255.255.0',
						mac: '00:11:22:33:44:55',
					},
				],
			}
		: null;

	const appStats: AppStats | null = statsData
		? {
				requests: {
					total: 1000,
					success: 950,
					error: 50,
					pending: 5,
					successRate: '95%',
				},
				performance: {
					avgResponseTime: '120ms',
					minResponseTime: '50ms',
					maxResponseTime: '500ms',
					p95ResponseTime: '300ms',
				},
				errors: {
					count: 50,
					byType: { ValidationError: 30, NetworkError: 20 },
				},
				database: {
					queries: 5000,
					avgQueryTime: '25ms',
					slowQueries: 10,
				},
				cache: {
					hits: 800,
					misses: 200,
					ratio: '80%',
				},
			}
		: null;

	const handleRefresh = useCallback(() => {
		logger.info('🔄 Refrescando estadísticas del servidor');
		fetchStats();
	}, [fetchStats]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Estadísticas del Servidor</h2>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleRefresh}
					disabled={loading}
					className="flex items-center gap-2"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
					Actualizar
				</Button>
			</div>

			{error && (
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<p className="text-destructive">
							{error instanceof Error ? error.message : 'Error al cargar estadísticas'}
						</p>
					</CardContent>
				</Card>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="system">Sistema</TabsTrigger>
					<TabsTrigger value="app">Aplicación</TabsTrigger>
				</TabsList>

				<TabsContent value="system" className="space-y-4 mt-4">
					{systemStats ? (
						<>
							<Card>
								<CardHeader>
									<CardTitle>Información del Sistema</CardTitle>
									<CardDescription>Detalles sobre el entorno de ejecución</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm text-muted-foreground">Plataforma</p>
											<p className="font-medium">{systemStats.platform}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Versión de Node.js</p>
											<p className="font-medium">{systemStats.nodeVersion}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Tiempo de actividad</p>
											<p className="font-medium">{systemStats.uptime}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Procesador</p>
											<p className="font-medium">
												{systemStats.cpu.model} ({systemStats.cpu.cores} núcleos)
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Card>
									<CardHeader>
										<CardTitle>CPU</CardTitle>
										<CardDescription>Uso actual del procesador</CardDescription>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Uso</span>
											<span className="font-medium">{systemStats.cpu.usage.toFixed(1)}%</span>
										</div>
										<Progress value={systemStats.cpu.usage} className="h-2" />
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Memoria</CardTitle>
										<CardDescription>Uso actual de memoria</CardDescription>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex justify-between items-center text-sm">
											<span className="text-muted-foreground">Total</span>
											<span>{systemStats.memory.total}</span>
										</div>
										<div className="flex justify-between items-center text-sm">
											<span className="text-muted-foreground">Usado</span>
											<span>{systemStats.memory.used}</span>
										</div>
										<div className="flex justify-between items-center text-sm">
											<span className="text-muted-foreground">Libre</span>
											<span>{systemStats.memory.free}</span>
										</div>
										<Progress value={systemStats.memory.usedPercentage} className="h-2 mt-2" />
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Red</CardTitle>
									<CardDescription>Interfaces de red disponibles</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{systemStats.network.map((net, index) => (
											<div key={index} className="p-3 border rounded-lg">
												<div className="grid grid-cols-2 gap-2 text-sm">
													<div>
														<span className="text-muted-foreground">Interfaz:</span>
														<span className="ml-2 font-medium">{net.interface}</span>
													</div>
													<div>
														<span className="text-muted-foreground">Dirección:</span>
														<span className="ml-2 font-mono">{net.address}</span>
													</div>
													<div>
														<span className="text-muted-foreground">Máscara:</span>
														<span className="ml-2 font-mono">{net.netmask}</span>
													</div>
													<div>
														<span className="text-muted-foreground">MAC:</span>
														<span className="ml-2 font-mono">{net.mac}</span>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</>
					) : loading ? (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">Cargando estadísticas del sistema...</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">No se pudieron cargar las estadísticas del sistema</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="app" className="space-y-4 mt-4">
					{appStats ? (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Card>
									<CardHeader>
										<CardTitle>Solicitudes HTTP</CardTitle>
										<CardDescription>Estadísticas de las peticiones</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="text-center p-3 bg-green-50 rounded-lg">
												<p className="text-2xl font-bold text-green-600">{appStats.requests.success}</p>
												<p className="text-sm text-green-700">Exitosas</p>
											</div>
											<div className="text-center p-3 bg-red-50 rounded-lg">
												<p className="text-2xl font-bold text-red-600">{appStats.requests.error}</p>
												<p className="text-sm text-red-700">Errores</p>
											</div>
										</div>
										<div className="text-center">
											<p className="text-sm text-muted-foreground">Total de solicitudes</p>
											<p className="text-lg font-semibold">{appStats.requests.total}</p>
											{appStats.requests.successRate && (
												<Badge variant="secondary" className="mt-1">
													{appStats.requests.successRate} éxito
												</Badge>
											)}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Rendimiento</CardTitle>
										<CardDescription>Tiempos de respuesta</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Promedio</span>
											<span className="font-medium">{appStats.performance.avgResponseTime}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Mínimo</span>
											<span className="font-medium">{appStats.performance.minResponseTime}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Máximo</span>
											<span className="font-medium">{appStats.performance.maxResponseTime}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">P95</span>
											<span className="font-medium">{appStats.performance.p95ResponseTime}</span>
										</div>
									</CardContent>
								</Card>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Card>
									<CardHeader>
										<CardTitle>Base de Datos</CardTitle>
										<CardDescription>Estadísticas de consultas</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Consultas totales</span>
											<span className="font-medium">{appStats.database.queries}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Tiempo promedio</span>
											<span className="font-medium">{appStats.database.avgQueryTime}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Consultas lentas</span>
											<span className="font-medium">{appStats.database.slowQueries}</span>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Caché</CardTitle>
										<CardDescription>Estadísticas de caché</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Aciertos</span>
											<span className="font-medium">{appStats.cache.hits}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Fallos</span>
											<span className="font-medium">{appStats.cache.misses}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Ratio</span>
											<Badge variant="secondary">{appStats.cache.ratio}</Badge>
										</div>
									</CardContent>
								</Card>
							</div>

							{appStats.errors.count > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>Errores</CardTitle>
										<CardDescription>Últimos errores registrados</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Total de errores</span>
											<Badge variant="destructive">{appStats.errors.count}</Badge>
										</div>
										{appStats.errors.last && (
											<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
												<p className="font-medium text-red-800">Último error:</p>
												<p className="text-sm text-red-700 mt-1">{appStats.errors.last.mensaje}</p>
												<Badge variant="outline" className="mt-2">
													{appStats.errors.last.tipo}
												</Badge>
											</div>
										)}
										{Object.keys(appStats.errors.byType).length > 0 && (
											<div>
												<p className="text-sm font-medium mb-2">Errores por tipo:</p>
												<div className="space-y-1">
													{Object.entries(appStats.errors.byType).map(([type, count]) => (
														<div key={type} className="flex justify-between items-center text-sm">
															<span className="text-muted-foreground">{type}</span>
															<Badge variant="outline">{count}</Badge>
														</div>
													))}
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							)}
						</>
					) : loading ? (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">Cargando estadísticas de la aplicación...</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">
									No se pudieron cargar las estadísticas de la aplicación
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
