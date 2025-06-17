'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getAppStats, getSystemStats } from '@/app/actions/debug/debug-stats.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
	const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
	const [appStats, setAppStats] = useState<AppStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState('system');

	// Función para cargar las estadísticas
	const fetchStats = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Cargar estadísticas del sistema
			const systemData = await getSystemStats();
			setSystemStats(systemData);

			// Cargar estadísticas de la aplicación
			const appData = await getAppStats();
			setAppStats(appData);

			logger.info('Estadísticas cargadas correctamente');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			setError(errorMessage);
			logger.error('Error al cargar estadísticas', { error: errorMessage });
		} finally {
			setLoading(false);
		}
	}, []);

	// Cargar estadísticas al montar el componente
	useEffect(() => {
		fetchStats();

		// Actualizar cada 30 segundos
		const interval = setInterval(fetchStats, 30000);

		return () => clearInterval(interval);
	}, [fetchStats]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Estadísticas del Servidor</h2>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={fetchStats}
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
						<p className="text-destructive">{error}</p>
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
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">Uso</span>
											<span className="font-medium">{systemStats.memory.usedPercentage.toFixed(1)}%</span>
										</div>
										<Progress value={systemStats.memory.usedPercentage} className="h-2" />
										<div className="grid grid-cols-3 gap-2 text-sm mt-2">
											<div>
												<p className="text-muted-foreground">Total</p>
												<p className="font-medium">{systemStats.memory.total}</p>
											</div>
											<div>
												<p className="text-muted-foreground">Usado</p>
												<p className="font-medium">{systemStats.memory.used}</p>
											</div>
											<div>
												<p className="text-muted-foreground">Libre</p>
												<p className="font-medium">{systemStats.memory.free}</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Interfaces de Red</CardTitle>
									<CardDescription>Información sobre las conexiones de red</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{systemStats.network.map((net) => (
											<div key={`network-${net.interface}-${net.mac}`} className="border rounded-md p-3">
												<div className="flex items-center justify-between mb-2">
													<span className="font-medium">{net.interface}</span>
													<Badge variant="outline">{net.mac}</Badge>
												</div>
												<div className="grid grid-cols-2 gap-2 text-sm">
													<div>
														<p className="text-muted-foreground">Dirección IP</p>
														<p>{net.address}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Máscara de red</p>
														<p>{net.netmask}</p>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</>
					) : (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">
									{loading ? 'Cargando estadísticas del sistema...' : 'No hay datos disponibles'}
								</p>
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
										<CardTitle>Solicitudes</CardTitle>
										<CardDescription>Estadísticas de solicitudes HTTP</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-muted-foreground">Total</p>
												<p className="font-medium">{appStats.requests.total}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Exitosas</p>
												<p className="font-medium">{appStats.requests.success}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Errores</p>
												<p className="font-medium">{appStats.requests.error}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Pendientes</p>
												<p className="font-medium">{appStats.requests.pending}</p>
											</div>
										</div>

										{appStats.requests.successRate && (
											<div className="space-y-2">
												<div className="flex justify-between items-center">
													<span className="text-sm text-muted-foreground">Tasa de éxito</span>
													<span className="font-medium">{appStats.requests.successRate}</span>
												</div>
												<Progress value={Number.parseFloat(appStats.requests.successRate)} className="h-2" />
											</div>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Rendimiento</CardTitle>
										<CardDescription>Tiempos de respuesta</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-muted-foreground">Promedio</p>
												<p className="font-medium">{appStats.performance.avgResponseTime}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Mínimo</p>
												<p className="font-medium">{appStats.performance.minResponseTime}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Máximo</p>
												<p className="font-medium">{appStats.performance.maxResponseTime}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Percentil 95</p>
												<p className="font-medium">{appStats.performance.p95ResponseTime}</p>
											</div>
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
									<CardContent>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-muted-foreground">Total de consultas</p>
												<p className="font-medium">{appStats.database.queries}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Tiempo promedio</p>
												<p className="font-medium">{appStats.database.avgQueryTime}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Consultas lentas</p>
												<p className="font-medium">{appStats.database.slowQueries}</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Caché</CardTitle>
										<CardDescription>Estadísticas de uso de caché</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-muted-foreground">Aciertos</p>
												<p className="font-medium">{appStats.cache.hits}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Fallos</p>
												<p className="font-medium">{appStats.cache.misses}</p>
											</div>
										</div>

										<div className="space-y-2">
											<div className="flex justify-between items-center">
												<span className="text-sm text-muted-foreground">Ratio de caché</span>
												<span className="font-medium">{appStats.cache.ratio}</span>
											</div>
											<Progress value={Number.parseFloat(appStats.cache.ratio)} className="h-2" />
										</div>
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Errores</CardTitle>
									<CardDescription>Información sobre errores registrados</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground">Total de errores</p>
											<p className="font-medium">{appStats.errors.count}</p>
										</div>

										{appStats.errors.last && (
											<div className="border rounded-md p-3 bg-muted/50">
												<p className="text-sm text-muted-foreground mb-1">Último error</p>
												<p className="font-medium">{appStats.errors.last.tipo}</p>
												<p className="text-sm">{appStats.errors.last.mensaje}</p>
											</div>
										)}

										{Object.keys(appStats.errors.byType).length > 0 && (
											<div>
												<p className="text-sm text-muted-foreground mb-2">Errores por tipo</p>
												<div className="grid grid-cols-2 gap-2">
													{Object.entries(appStats.errors.byType).map(([type, count]) => (
														<div key={type} className="flex justify-between items-center">
															<span className="text-sm">{type}</span>
															<Badge variant="outline">{count}</Badge>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</>
					) : (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">
									{loading ? 'Cargando estadísticas de la aplicación...' : 'No hay datos disponibles'}
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
