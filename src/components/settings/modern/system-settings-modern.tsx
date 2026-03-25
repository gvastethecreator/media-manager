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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useRepairSystem, useResetDatabase, useSystemStats, useSystemVersion } from '@/lib/api/system';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { SettingsCard, SettingsGroup, SettingsRow } from '../modern/settings-card';

function formatBytes(bytes: number): string {
	if (!bytes || bytes <= 0) {
		return '0 B';
	}

	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let value = bytes;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex++;
	}

	return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unitIndex]}`;
}

function formatUptime(seconds?: number): string {
	if (!seconds || seconds <= 0) {
		return 'N/A';
	}

	const days = Math.floor(seconds / 86_400);
	const hours = Math.floor((seconds % 86_400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (days > 0) {
		return `${days}d ${hours}h ${minutes}m`;
	}

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}

	return `${minutes}m`;
}

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

	useEffect(() => {
		if (!autoRefresh) {
			return;
		}

		const intervalId = window.setInterval(() => {
			void refetch();
		}, 30_000);

		return () => window.clearInterval(intervalId);
	}, [autoRefresh, refetch]);

	// Helper to extract stats safely
	const diskTotal = rawStats?.diskUsage?.total || (rawStats?.storageUsed || 0) + (rawStats?.storageAvailable || 0);
	const diskUsed = rawStats?.diskUsage?.used ?? rawStats?.storageUsed ?? 0;
	const diskFree = rawStats?.diskUsage?.free ?? rawStats?.storageAvailable ?? 0;
	const diskUsagePercentage = rawStats?.diskUsage?.usedPercentage ?? (diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0);
	const stats = {
		cpuUsage: rawStats?.cpuUsage || 0,
		memoryUsage: rawStats?.memoryUsage || 0,
		dbSize: rawStats?.formattedDatabaseSize || '0 B',
		dbSizeRaw: rawStats?.databaseSize || rawStats?.dbSize || 0,
		totalEntities:
			(rawStats?.totalImages || 0) +
			(rawStats?.totalVideos || 0) +
			(rawStats?.totalAudio || 0) +
			(rawStats?.totalDocuments || 0) +
			(rawStats?.totalJsonFiles || 0) +
			(rawStats?.totalFile3D || 0) +
			(rawStats?.totalFolders || 0) +
			(rawStats?.totalAlbums || 0) +
			(rawStats?.totalCollections || 0) +
			(rawStats?.totalTags || 0) +
			(rawStats?.totalCharacters || 0) +
			(rawStats?.totalPlaces || 0) +
			(rawStats?.totalConcepts || 0) +
			(rawStats?.totalPrompts || 0) +
			(rawStats?.totalNotes || 0) +
			(rawStats?.totalProperties || 0) +
			(rawStats?.totalWildcards || 0) +
			(rawStats?.totalWorldItems || 0),
		storageUsed: diskUsed,
		storageAvailable: diskFree,
		totalTables: rawStats?.totalMetadata || 0,
		uptime: formatUptime(rawStats?.uptime),
		version: versionData?.version || '2.4.1',
		platform: rawStats?.platform || 'N/A',
		hostname: rawStats?.hostname || 'N/A',
		nodeVersion: rawStats?.nodeVersion || 'N/A',
		memoryUsed: formatBytes(rawStats?.memoryUsed || 0),
		memoryTotal: formatBytes(rawStats?.memoryTotal || 0),
		cpuModel: rawStats?.cpuModel || 'N/A',
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
								<span className="font-bold text-3xl text-foreground">{Math.round(diskUsagePercentage)}%</span>
								<span className="text-muted-foreground text-sm">en uso</span>
							</div>
							<Progress className="h-2" value={diskUsagePercentage} />
							<p className="text-muted-foreground text-xs uppercase tracking-tight">
								{formatBytes(diskUsed)} usados • {formatBytes(diskFree)} libres
							</p>
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
						<SettingsRow label="Sistema operativo">
							<Badge variant="outline">{stats.platform}</Badge>
						</SettingsRow>
						<SettingsRow label="Host">
							<span className="text-muted-foreground text-sm">{stats.hostname}</span>
						</SettingsRow>
						<SettingsRow label="Node/Bun runtime">
							<span className="text-muted-foreground text-sm">{stats.nodeVersion}</span>
						</SettingsRow>
						<SettingsRow label="CPU actual">
							<span className="text-muted-foreground text-sm">
								{stats.cpuUsage}% • {stats.cpuModel}
							</span>
						</SettingsRow>
						<SettingsRow label="Memoria">
							<span className="text-muted-foreground text-sm">
								{stats.memoryUsed} / {stats.memoryTotal} ({stats.memoryUsage}%)
							</span>
						</SettingsRow>
						<SettingsRow label="Uptime">
							<span className="text-muted-foreground text-sm">{stats.uptime}</span>
						</SettingsRow>
					</div>
				</SettingsCard>
			</div>
		</div>
	);
}
