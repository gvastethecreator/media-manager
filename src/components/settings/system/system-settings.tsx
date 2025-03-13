'use client';

import { getSystemStats, repairSystem, resetDatabase } from '@/app/actions/system/system.actions';
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
import { Separator } from '@/components/ui/separator';
import { toastService } from '@/lib/services/toast.service';
import { Activity, AlertCircle, Database, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

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
	const [systemData, setSystemData] = useState<SystemData>({
		cpuUsage: 0,
		memoryUsage: 0,
		cacheSize: 0,
		dbSize: 0,
		totalEntities: 0,
		uptime: 0,
		nodeVersion: '',
		hostname: '',
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isRepairing, setIsRepairing] = useState(false);
	const [isResetting, setIsResetting] = useState(false);

	// Función para cargar estadísticas del sistema
	const loadSystemStats = useCallback(async () => {
		try {
			setIsLoading(true);
			const stats = await getSystemStats();
			setSystemData(stats);
		} catch (error) {
			console.error('Error al cargar estadísticas del sistema:', error);
			toastService.error('No se pudieron cargar las estadísticas del sistema');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar datos inicialmente
	useEffect(() => {
		loadSystemStats();

		// Actualizar estadísticas cada minuto
		const intervalId = setInterval(() => {
			loadSystemStats();
		}, 60000);

		return () => clearInterval(intervalId);
	}, [loadSystemStats]);

	// Manejar reparación del sistema
	const handleRepair = async () => {
		try {
			setIsRepairing(true);
			const result = await repairSystem();

			if (result.success) {
				toastService.success(result.message);

				// Recargar estadísticas tras la reparación
				loadSystemStats();
			} else {
				toastService.error(result.message);
			}
		} catch (error) {
			console.error('Error al reparar el sistema:', error);
			toastService.error('No se pudo completar la reparación del sistema');
		} finally {
			setIsRepairing(false);
		}
	};

	// Manejar reseteo de la base de datos
	const handleReset = async () => {
		try {
			setIsResetting(true);
			const result = await resetDatabase();

			if (result.success) {
				toastService.success(result.message);

				// Recargar estadísticas tras el reseteo
				loadSystemStats();
			} else {
				toastService.error(result.message);
			}
		} catch (error) {
			console.error('Error al resetear la base de datos:', error);
			toastService.error('No se pudo completar el reseteo de la base de datos');
		} finally {
			setIsResetting(false);
		}
	};

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm border-none">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<Activity className="h-5 w-5" /> Estado del Sistema
					</span>
					<Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={loadSystemStats} disabled={isLoading}>
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

					<motion.div
						animate={{
							opacity: [0, 1],
							y: [20, 0],
						}}
						className="space-y-1.5"
					>
						<div className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent transition-colors group">
							<div className="flex items-center gap-2">
								<RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
								<div>
									<span className="text-xs font-medium">Reparar sistema</span>
									<p className="text-[10px] text-muted-foreground">Corrige problemas comunes</p>
								</div>
							</div>
							<Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRepair} disabled={isRepairing}>
								{isRepairing ? (
									<>
										<RefreshCw className="h-3 w-3 mr-1 animate-spin" />
										Reparando...
									</>
								) : (
									'Reparar'
								)}
							</Button>
						</div>

						<AlertDialog>
							<AlertDialogTrigger asChild>
								<motion.div
									animate={{ scale: 1 }}
									className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer group"
								>
									<div className="flex items-center gap-2">
										<Trash2 className="h-3.5 w-3.5 text-destructive" />
										<div>
											<span className="text-xs font-medium">Resetear base de datos</span>
											<p className="text-[10px] text-muted-foreground">Elimina todos los datos</p>
										</div>
									</div>
									<Button variant="destructive" size="sm" className="h-7 text-xs">
										Resetear
									</Button>
								</motion.div>
							</AlertDialogTrigger>
							<AlertDialogContent className="sm:max-w-[425px]">
								<AlertDialogHeader>
									<AlertDialogTitle className="text-base flex items-center gap-2">
										<AlertCircle className="h-5 w-5 text-destructive" />
										¿Estás seguro?
									</AlertDialogTitle>
									<AlertDialogDescription className="text-xs">
										Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos de la base de datos.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
									<AlertDialogAction
										className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
										onClick={handleReset}
										disabled={isResetting}
									>
										{isResetting ? (
											<>
												<RefreshCw className="h-3 w-3 mr-1 animate-spin" />
												Eliminando...
											</>
										) : (
											'Eliminar'
										)}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</motion.div>
				</div>
			</CardContent>
		</Card>
	);
}
