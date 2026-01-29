/**
 * @file Modern System Settings
 * @module components/settings/modern/system-settings-modern
 * @description Vista de configuración del sistema con diseño mejorado
 */

import React, { useState } from 'react';
import {
	AlertTriangle,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Cpu,
	Database,
	Eye,
	HardDrive,
	MemoryStick,
	RefreshCw,
	Server,
	Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
	SettingsCard,
	SettingsRow,
	SettingsGroup,
} from '../modern/settings-card';

/**
 * Datos simulados de estadísticas del sistema
 */
const SYSTEM_STATS = {
	cpu: { usage: 45, cores: 8, model: 'Intel Core i9' },
	memory: { used: '12.4 GB', total: '32 GB', usage: 38.75 },
	disk: { used: '234.5 GB', total: '512 GB', usage: 45.8 },
	database: { size: '1.2 GB', tables: 24, connections: 5 },
	uptime: '15d 7h 23m',
	version: 'v2.4.1',
	build: '2025-01-29',
};

export function SystemSettingsModern() {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [logLevel, setLogLevel] = useState('info');

	const handleRefresh = async () => {
		setIsRefreshing(true);
		// Simular refresh
		await new Promise((resolve) => setTimeout(resolve, 1500));
		setIsRefreshing(false);
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold text-foreground">Configuración del Sistema</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Monitoreo y configuración general del servidor
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleRefresh}
					disabled={isRefreshing}
					className="gap-2"
				>
					<RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
					Actualizar
				</Button>
			</div>

			{/* Stats Overview - 4 Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{/* CPU Card */}
				<Card className="border-l-4" style={{ borderLeftColor: 'var(--primary)' }}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">CPU</CardTitle>
							<Cpu className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-bold text-foreground">
									{SYSTEM_STATS.cpu.usage}%
								</span>
								<span className="text-xs text-muted-foreground">
									{SYSTEM_STATS.cpu.cores} núcleos
								</span>
							</div>
							<Progress value={SYSTEM_STATS.cpu.usage} className="h-2" />
							<p className="text-xs text-muted-foreground">
								{SYSTEM_STATS.cpu.model}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Memory Card */}
				<Card className="border-l-4" style={{ borderLeftColor: 'var(--entity-tag)' }}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">Memoria</CardTitle>
							<MemoryStick className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-bold text-foreground">
									{SYSTEM_STATS.memory.usage}%
								</span>
								<span className="text-xs text-muted-foreground">
									{SYSTEM_STATS.memory.used} / {SYSTEM_STATS.memory.total}
								</span>
							</div>
							<Progress value={SYSTEM_STATS.memory.usage} className="h-2" />
							<Badge variant="outline" className="w-fit text-xs">
								32GB DDR4
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* Disk Card */}
				<Card className="border-l-4" style={{ borderLeftColor: 'var(--entity-folder)' }}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
							<HardDrive className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-bold text-foreground">
									{SYSTEM_STATS.disk.usage}%
								</span>
								<span className="text-xs text-muted-foreground">
									{SYSTEM_STATS.disk.used} / {SYSTEM_STATS.disk.total}
								</span>
							</div>
							<Progress value={SYSTEM_STATS.disk.usage} className="h-2" />
							<p className="text-xs text-muted-foreground">
								NVMe SSD 512GB
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Database Card */}
				<Card className="border-l-4" style={{ borderLeftColor: 'var(--entity-collection)' }}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
							<Database className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-bold text-foreground">
									{SYSTEM_STATS.database.tables}
								</span>
								<span className="text-xs text-muted-foreground">
									tablas
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="secondary" className="text-xs">
									{SYSTEM_STATS.database.size}
								</Badge>
								<Badge variant="outline" className="text-xs">
									{SYSTEM_STATS.database.connections} conexiones
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Server Configuration Card */}
			<SettingsCard
				icon={<Server />}
				title="Configuración del Servidor"
				description="Ajustes de rendimiento y disponibilidad"
				color="var(--primary)"
				variant="outlined"
			>
				<SettingsGroup title="Rendimiento">
					<SettingsRow
						label="Auto-actualización de estadísticas"
						description="Actualizar métricas del sistema cada 30 segundos"
					>
						<Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
					</SettingsRow>
					<SettingsRow label="Cache de consultas" description="Habilitar caché para queries frecuentes">
						<Switch defaultChecked />
					</SettingsRow>
					<SettingsRow
						label="Límite de memoria de workers"
						description="Máximo de memoria RAM por worker (MB)"
					>
						<Input type="number" defaultValue={512} className="w-24" />
					</SettingsRow>
				</SettingsGroup>

				<Separator className="my-4" />

				<SettingsGroup title="Nivel de Logging">
					<div className="space-y-3">
						{['error', 'warn', 'info', 'debug'].map((level) => (
							<div key={level} className="flex items-center justify-between">
								<Label htmlFor={`log-${level}`} className="cursor-pointer">
									{level.charAt(0).toUpperCase() + level.slice(1)}
								</Label>
								<input
									id={`log-${level}`}
									type="radio"
									name="log-level"
									checked={logLevel === level}
									onChange={() => setLogLevel(level)}
									className="h-4 w-4 cursor-pointer accent-primary"
								/>
							</div>
						))}
					</div>
				</SettingsGroup>
			</SettingsCard>

			{/* Database Configuration Card */}
			<Collapsible defaultOpen>
				<CollapsibleTrigger asChild>
					<SettingsCard
						icon={<Database />}
						title="Base de Datos"
						description="Configuración y mantenimiento de Drizzle ORM"
						color="var(--entity-collection)"
						className="cursor-pointer hover:bg-muted/50"
					>
						<ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
					</SettingsCard>
				</CollapsibleTrigger>
				<CollapsibleContent className="space-y-4 pt-4">
					<SettingsGroup title="Backups Automáticos">
						<SettingsRow
							label="Activar backups diarios"
							description="Crear copia de seguridad a las 02:00 AM"
						>
							<Switch defaultChecked />
						</SettingsRow>
						<SettingsRow label="Retención de backups" description="Días a conservar">
							<div className="flex items-center gap-2">
								<Input type="number" defaultValue={7} className="w-20" />
								<span className="text-sm text-muted-foreground">días</span>
							</div>
						</SettingsRow>
					</SettingsGroup>

					<Separator />

					<SettingsGroup title="Mantenimiento">
						<SettingsRow label="Optimización automática" description="Ejecutar VACUUM semanalmente">
							<Switch defaultChecked />
						</SettingsRow>
						<SettingsRow
							label="Analizar tabla"
							description="Ejecutar ANALYZE para actualizar estadísticas"
						>
							<Button variant="outline" size="sm">
								<Eye className="mr-2 h-4 w-4" />
								Analizar
							</Button>
						</SettingsRow>
						<SettingsRow label="Vaciar caché" description="Limpiar caché de consultas">
							<Button variant="destructive" size="sm">
								<AlertTriangle className="mr-2 h-4 w-4" />
								Vaciar
							</Button>
						</SettingsRow>
					</SettingsGroup>

					<Separator />

					<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
								<CheckCircle className="h-5 w-5 text-green-600" />
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-medium text-foreground">Estado: Sano</span>
								<span className="text-xs text-muted-foreground">
									Último backup: hace 23h 45m
								</span>
							</div>
						</div>
						<Button variant="outline" size="sm">
							Ver logs
							<ChevronRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</CollapsibleContent>
			</Collapsible>

			{/* System Info Card */}
			<SettingsCard
				icon={<Zap />}
				title="Información del Sistema"
				description="Detalles técnicos y versión"
				color="var(--entity-system)"
				variant="outlined"
			>
				<div className="space-y-4">
					<SettingsRow label="Versión">
						<Badge variant="outline">{SYSTEM_STATS.version}</Badge>
					</SettingsRow>
					<SettingsRow label="Build">
						<span className="text-sm text-muted-foreground">{SYSTEM_STATS.build}</span>
					</SettingsRow>
					<SettingsRow label="Tiempo activo">
						<span className="text-sm text-foreground font-medium">{SYSTEM_STATS.uptime}</span>
					</SettingsRow>
					<Separator />
					<SettingsRow
						label="Actualización automática"
						description="Buscar actualizaciones periódicamente"
					>
						<Switch defaultChecked />
					</SettingsRow>
					<Button variant="outline" className="w-full">
						<RefreshCw className="mr-2 h-4 w-4" />
						Ver actualizaciones
					</Button>
				</div>
			</SettingsCard>
		</div>
	);
}
