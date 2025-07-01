'use client';

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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRepairSystem, useResetDatabase, useSystemStats } from '@/lib/api/system';
import toastService from '@/services/toast';
import { Activity, AlertCircle, Database, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback } from 'react';

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

export function SystemSettings() {
	// Usar React Query hooks en lugar de server actions
	const {
		data: systemData = {
			cpuUsage: 0,
			memoryUsage: 0,
			cacheSize: 0,
			dbSize: 0,
			totalEntities: 0,
			uptime: 0,
			nodeVersion: '',
			hostname: '',
		} as SystemData,
		isLoading,
		refetch: loadSystemStats,
	} = useSystemStats();

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
			<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm border-none">
				<CardHeader className="p-2 pb-0 bg-transparent">
					<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
						<span className="flex items-center gap-2 h-7">
							<Activity className="h-5 w-5" /> Estado del Sistema
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 w-7 p-0"
							onClick={() => loadSystemStats()}
							disabled={isLoading}
						>
							<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
							<span className="sr-only">Actualizar</span>
						</Button>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="p-2">
					<div className="space-y-3">
						<motion.div
							animate={{
								opacity: [0, 1],
								y: [20, 0],
							}}
							className="space-y-2"
						>
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<Activity className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="text-xs">CPU</span>
									</div>
									<Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
										{systemData.cpuUsage}%
									</Badge>
								</div>
								<Progress value={systemData.cpuUsage} className="h-1" />
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="text-xs">Memoria</span>
									</div>
									<Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
										{systemData.memoryUsage}%
									</Badge>
								</div>
								<Progress value={systemData.memoryUsage} className="h-1" />
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<Database className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="text-xs">Caché</span>
									</div>
									<Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
										{systemData.cacheSize}MB
									</Badge>
								</div>
								<Progress value={(systemData.cacheSize / 1000) * 100} max={100} className="h-1" />
							</div>

							{/* Información adicional */}
							<div className="mt-2 text-xs text-muted-foreground space-y-1 p-2 bg-background/50 rounded-md">
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
								variant="outline"
								size="sm"
								onClick={handleRepair}
								disabled={repairSystemMutation.isPending}
								className="w-full justify-start"
							>
								<RefreshCw className={`h-4 w-4 mr-2 ${repairSystemMutation.isPending ? 'animate-spin' : ''}`} />
								{repairSystemMutation.isPending ? 'Reparando...' : 'Reparar Sistema'}
							</Button>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="destructive"
										size="sm"
										disabled={resetDatabaseMutation.isPending}
										className="w-full justify-start"
									>
										<Trash2 className="h-4 w-4 mr-2" />
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
											onClick={handleReset}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
