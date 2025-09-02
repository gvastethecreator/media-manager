import { Activity, AlertCircle, Database, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from '@/components/ui/motion-shim';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRepairSystem, useResetDatabase, useSystemStats } from '@/lib/api/system';
import { toastService } from '@/lib/ui/toast';

// Tipo para estadísticas del sistema
interface SystemData {
	cpuUsage: number;
	memoryUsage: number;
	cacheSize: number;
	dbSize: number;
	totalEntities: number;
	uptime: number;
	nodeVersion: string;
	hostname: string;
}

// Función para mapear SystemStats a SystemData
function mapSystemStatsToSystemData(stats: any): SystemData {
	return {
		cpuUsage: 0, // No disponible en SystemStats
		memoryUsage: 0, // No disponible en SystemStats
		cacheSize: 0, // No disponible en SystemStats
		dbSize: stats?.dbSize || 0,
		totalEntities:
			(stats?.totalImages || 0) + (stats?.totalVideos || 0) + (stats?.totalAudio || 0) + (stats?.totalFolders || 0),
		uptime: 0, // No disponible en SystemStats
		nodeVersion: '', // No disponible en SystemStats
		hostname: '', // No disponible en SystemStats
	};
}

export function SystemSettings() {
	// Usar React Query hooks en lugar de server actions
	const { data: rawSystemData, isLoading, refetch: loadSystemStats } = useSystemStats();

	// Mapear los datos del sistema
	const systemData = rawSystemData
		? mapSystemStatsToSystemData(rawSystemData)
		: ({
				cpuUsage: 0,
				memoryUsage: 0,
				cacheSize: 0,
				dbSize: 0,
				totalEntities: 0,
				uptime: 0,
				nodeVersion: '',
				hostname: '',
			} as SystemData);

	const repairSystemMutation = useRepairSystem();
	const resetDatabaseMutation = useResetDatabase();

	// Manejar reparación del sistema
	const handleRepair = useCallback(async () => {
		try {
			const result = await repairSystemMutation.mutateAsync();

			if (result.success) {
				toastService.success(result.message);
				// Recargar estadísticas tras la reparación
				loadSystemStats();
			} else {
				toastService.error(result.message);
			}
		} catch (error) {
			toastService.error('No se pudo completar la reparación del sistema');
		}
	}, [repairSystemMutation, loadSystemStats]);

	// Manejar reseteo de la base de datos
	const handleReset = useCallback(async () => {
		try {
			const result = await resetDatabaseMutation.mutateAsync();

			if (result.success) {
				toastService.success(result.message);
				// Recargar estadísticas tras el reseteo
				loadSystemStats();
			} else {
				toastService.error(result.message);
			}
		} catch (error) {
			toastService.error('No se pudo completar el reseteo de la base de datos');
		}
	}, [resetDatabaseMutation, loadSystemStats]);

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="flex h-full flex-col gap-2 rounded-sm border-none bg-muted/30">
				<CardHeader className="bg-transparent p-2 pb-0">
					<CardTitle className="flex items-center justify-between pl-1 font-semibold text-base text-muted-foreground">
						<span className="flex h-7 items-center gap-2">
							<Activity className="h-5 w-5" /> Estado del Sistema
						</span>
						<Button
							className="h-7 w-7 p-0"
							disabled={isLoading}
							onClick={() => loadSystemStats()}
							size="sm"
							variant="ghost"
						>
							<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
							<span className="sr-only">Actualizar</span>
						</Button>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="flex-1 overflow-y-auto p-2">
					<div className="flex h-full flex-col space-y-3">
						<motion.div
							animate={{
								opacity: 1,
								y: 0,
							}}
							className="space-y-2"
							initial={{
								opacity: 0,
								y: 20,
							}}
						>
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<Activity className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="text-xs">CPU</span>
									</div>
									<Badge className="h-4 px-1 font-mono text-[10px]" variant="outline">
										{systemData.cpuUsage}%
									</Badge>
								</div>
								<Progress className="h-1" value={systemData.cpuUsage} />
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="text-xs">Memoria</span>
									</div>
									<Badge className="h-4 px-1 font-mono text-[10px]" variant="outline">
										{systemData.memoryUsage}%
									</Badge>
								</div>
								<Progress className="h-1" value={systemData.memoryUsage} />
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<Database className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="text-xs">Caché</span>
									</div>
									<Badge className="h-4 px-1 font-mono text-[10px]" variant="outline">
										{systemData.cacheSize}MB
									</Badge>
								</div>
								<Progress className="h-1" max={100} value={(systemData.cacheSize / 1000) * 100} />
							</div>

							{/* Información adicional */}
							<div className="mt-2 flex-1 space-y-1 rounded-md bg-background/50 p-2 text-muted-foreground text-xs">
								<div className="flex justify-between">
									<span>Entidades:</span>
									<span className="font-medium">{systemData.totalEntities}</span>
								</div>
								<div className="flex justify-between">
									<span>Tamaño DB:</span>
									<span className="font-medium">{systemData.dbSize.toFixed(2)} MB</span>
								</div>
								<div className="flex justify-between">
									<span>Uptime:</span>
									<span className="font-medium">{systemData.uptime} horas</span>
								</div>
								<div className="flex justify-between">
									<span>Versión Node:</span>
									<span className="font-medium">{systemData.nodeVersion}</span>
								</div>
								<div className="flex justify-between">
									<span>Hostname:</span>
									<span className="font-medium">{systemData.hostname}</span>
								</div>
							</div>
						</motion.div>

						<Separator className="my-2" />

						{/* Acciones del sistema */}
						<div className="space-y-2">
							<Button
								className="w-full justify-start"
								disabled={repairSystemMutation.isPending}
								onClick={handleRepair}
								size="sm"
								variant="outline"
							>
								<RefreshCw className={`mr-2 h-4 w-4 ${repairSystemMutation.isPending ? 'animate-spin' : ''}`} />
								{repairSystemMutation.isPending ? 'Reparando...' : 'Reparar Sistema'}
							</Button>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										className="w-full justify-start"
										disabled={resetDatabaseMutation.isPending}
										size="sm"
										variant="destructive"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Resetear Base de Datos
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle className="flex items-center gap-2">
											<AlertCircle className="h-5 w-5 text-destructive" />
											¿Resetear la base de datos?
										</AlertDialogTitle>
										<AlertDialogDescription>
											Esta acción eliminará todos los datos de la base de datos y no se puede deshacer. Todos los
											álbumes, imágenes, etiquetas y configuraciones se perderán permanentemente.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancelar</AlertDialogCancel>
										<AlertDialogAction
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
											onClick={handleReset}
										>
											{resetDatabaseMutation.isPending ? 'Reseteando...' : 'Resetear'}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				</CardContent>
			</Card>
		</ScrollArea>
	);
}
