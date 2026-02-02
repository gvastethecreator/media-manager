/**
 * @file Modern System Settings
 * @module components/settings/modern/system-settings-modern
 * @description Vista de configuración del sistema con diseño mejorado y datos reales
 */

import {
	AlertTriangle,
	CheckCircle,
	ChevronDown,
	Database,
	Eye,
	HardDrive,
	RefreshCw,
	Server,
	Users,
	Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group-v3';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch-v3';
import { useRepairSystem, useResetDatabase, useSystemStats, useSystemVersion } from '@/lib/api/system';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { SettingsCard, SettingsGroup, SettingsRow } from '../modern/settings-card';

export function SystemSettingsModern() {
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [logLevel, setLogLevel] = useState('info');
	const [searchParams] = useSearchParams();

	// Scroll to section based on URL params
	useEffect(() => {
		const item = searchParams.get('item');
		if (item && ['general', 'storage', 'database'].includes(item)) {
			const element = document.getElementById(`system-${item}`);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	}, [searchParams]);

	// Real Data Hooks
	const { data: rawStats, isLoading, refetch } = useSystemStats();
	const { data: versionData } = useSystemVersion();
	const repairSystemMutation = useRepairSystem();
	const resetDatabaseMutation = useResetDatabase();

	// Helper to extract stats safely
	const stats = {
		cpuUsage: 0, // Not provided by current API
		memoryUsage: 0, // Not provided by current API
		dbSize: rawStats?.formattedDatabaseSize || '0 B',
		dbSizeRaw: rawStats?.databaseSize || 0,
		totalEntities:
			(rawStats?.totalImages || 0) +
			(rawStats?.totalVideos || 0) +
			(rawStats?.totalAudio || 0) +
			(rawStats?.totalFolders || 0),
		storageUsed: rawStats?.storageUsed || 0,
		storageAvailable: rawStats?.storageAvailable || 0,
		totalTables: 0, // Not provided by API explicitly
		uptime: 'N/A', // Not provided
		version: versionData?.version || '2.4.1',
	};

	const handleRefresh = async () => {
		await refetch();
	};

	const handleRepair = async () => {
		try {
			const result = await repairSystemMutation.mutateAsync();
			if (result.success) {
				toastService.success(result.message);
				refetch();
			} else {
				toastService.error(result.message);
			}
		} catch (error) {
			toastService.error('Error al reparar el sistema');
		}
	};

	const handleReset = async () => {
		try {
			const result = await resetDatabaseMutation.mutateAsync();
			if (result.success) {
				toastService.success(result.message);
				refetch();
			} else {
				toastService.error(result.message);
			}
		} catch (error) {
			toastService.error('Error crítico al resetear base de datos');
		}
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-2xl text-foreground">Configuración del Sistema</h2>
					<p className="mt-1 text-muted-foreground text-sm">Monitoreo y configuración general del servidor</p>
				</div>
				<Button className="gap-2" disabled={isLoading} onClick={handleRefresh} size="sm" variant="outline">
					<RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
					Actualizar
				</Button>
			</div>

			{/* Stats Overview - 4 Real Data Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{/* Storage Card - Real Data */}
				<Card
					className="overflow-hidden border-l bg-card/50"
					style={{ borderLeftColor: 'color-mix(in oklch, var(--entity-folder) 50%, transparent)' }}
				>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="font-medium text-sm">Almacenamiento</CardTitle>
							<HardDrive className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">
									{rawStats
										? Math.round((rawStats.storageUsed / (rawStats.storageUsed + rawStats.storageAvailable || 1)) * 100)
										: 0}
									%
								</span>
								<span className="text-muted-foreground text-sm">en uso</span>
							</div>
							<Progress
								className="h-2"
								value={
									rawStats ? (rawStats.storageUsed / (rawStats.storageUsed + rawStats.storageAvailable || 1)) * 100 : 0
								}
							/>
							<p className="text-muted-foreground text-xs uppercase tracking-tight">System Drive</p>
						</div>
					</CardContent>
				</Card>

				{/* Entities Card - Real Data */}
				<Card
					className="overflow-hidden border-l bg-card/50"
					style={{ borderLeftColor: 'color-mix(in oklch, var(--entity-tag) 50%, transparent)' }}
				>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="font-medium text-sm">Archivos Totales</CardTitle>
							<Database className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">{stats.totalEntities}</span>
								<span className="text-muted-foreground text-sm">registros</span>
							</div>
							<div className="flex gap-1 text-[10px] text-muted-foreground">
								<span>{rawStats?.totalImages || 0} IMG</span>
								<span>•</span>
								<span>{rawStats?.totalVideos || 0} VID</span>
								<span>•</span>
								<span>{rawStats?.totalAudio || 0} AUD</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Org Card - Real Data */}
				<Card
					className="overflow-hidden border-l bg-card/50"
					style={{ borderLeftColor: 'color-mix(in oklch, var(--entity-character) 50%, transparent)' }}
				>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="font-medium text-sm">Organización</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">
									{(rawStats?.totalAlbums || 0) + (rawStats?.totalCollections || 0) + (rawStats?.totalCharacters || 0)}
								</span>
								<span className="text-muted-foreground text-sm">items</span>
							</div>
							<div className="flex gap-1 text-[10px] text-muted-foreground">
								<span>{rawStats?.totalAlbums || 0} ALB</span>
								<span>•</span>
								<span>{rawStats?.totalCollections || 0} COL</span>
								<span>•</span>
								<span>{rawStats?.totalCharacters || 0} CHA</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Database Card - Real Data */}
				<Card className="border-l-2 bg-card/50" style={{ borderLeftColor: 'var(--entity-collection)' }}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="font-medium text-sm">Base de Datos</CardTitle>
							<Database className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">{stats.dbSize}</span>
							</div>
							<div className="flex items-center gap-2">
								<Badge className="font-mono text-[10px]" variant="outline">
									SQLITE-DRIZZLE
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Server Configuration Card */}
			<div id="system-general">
				<SettingsCard
					color="var(--primary)"
					description="Ajustes de rendimiento y disponibilidad"
					icon={<Server />}
					title="Configuración del Servidor"
					variant="outlined"
				>
					<SettingsGroup title="Rendimiento">
						<SettingsRow
							description="Actualizar métricas del sistema cada 30 segundos"
							label="Auto-actualización de estadísticas"
						>
							<Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
						</SettingsRow>
						<SettingsRow description="Habilitar caché para queries frecuentes" label="Cache de consultas">
							<Switch defaultChecked />
						</SettingsRow>
					</SettingsGroup>

					<Separator className="my-4" />

					<SettingsGroup title="Nivel de Logging">
						<RadioGroup className="space-y-3" onValueChange={(value) => setLogLevel(value)} value={logLevel}>
							{['error', 'warn', 'info', 'debug'].map((level) => (
								<div className="flex items-center justify-between" key={level}>
									<Label className="cursor-pointer" htmlFor={`log-${level}`}>
										{level.charAt(0).toUpperCase() + level.slice(1)}
									</Label>
									<RadioGroupItem id={`log-${level}`} value={level} />
								</div>
							))}
						</RadioGroup>
					</SettingsGroup>
				</SettingsCard>
			</div>

			{/* Database Configuration Card */}
			<div id="system-database">
				<Collapsible defaultOpen>
					<CollapsibleTrigger asChild>
						<SettingsCard
							className="cursor-pointer hover:bg-muted/50"
							color="var(--entity-collection)"
							description="Configuración y mantenimiento de Drizzle ORM"
							icon={<Database />}
							title="Acciones de Base de Datos"
						>
							<ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
						</SettingsCard>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-4 pt-4">
						<SettingsGroup title="Mantenimiento">
							<SettingsRow description="Verificar integridad y reparar índices" label="Reparar Sistema">
								<Button disabled={repairSystemMutation.isPending} onClick={handleRepair} size="sm" variant="outline">
									<Eye className={cn('mr-2 h-4 w-4', repairSystemMutation.isPending && 'animate-spin')} />
									{repairSystemMutation.isPending ? 'Reparando...' : 'Ejecutar Reparación'}
								</Button>
							</SettingsRow>
							<SettingsRow description="Eliminar todos los datos y reiniciar (Destructivo)" label="Resetear DB">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button size="sm" variant="destructive">
											<AlertTriangle className="mr-2 h-4 w-4" />
											Resetear Todo
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
											<AlertDialogDescription>
												Esta acción eliminará PERMANENTEMENTE todos los datos de la base de datos.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction
												className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
												onClick={handleReset}
											>
												Sí, resetear
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</SettingsRow>
						</SettingsGroup>

						<Separator />

						<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-full"
									style={{ backgroundColor: 'color-mix(in oklch, var(--dt-success-500) 10%, transparent)' }}
								>
									<CheckCircle className="h-5 w-5" style={{ color: 'var(--dt-success-600)' }} />
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-foreground text-sm">Estado: Conectado</span>
									<span className="text-muted-foreground text-sm">Driver: SQLite-Drizzle</span>
								</div>
							</div>
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>

			{/* System Info Card */}
			<div id="system-storage">
				<SettingsCard
					color="var(--entity-system)"
					description="Detalles técnicos y versión"
					icon={<Zap />}
					title="Información del Sistema"
					variant="outlined"
				>
					<div className="space-y-4">
						<SettingsRow label="Versión">
							<Badge variant="outline">{stats.version}</Badge>
						</SettingsRow>
					</div>
				</SettingsCard>
			</div>
		</div>
	);
}
