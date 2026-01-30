/**
 * @file Modern System Settings
 * @module components/settings/modern/system-settings-modern
 * @description Vista de configuración del sistema con diseño mejorado
 */

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
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SettingsCard, SettingsGroup, SettingsRow } from '../modern/settings-card';

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
					<h2 className="font-semibold text-2xl text-foreground">Configuración del Sistema</h2>
					<p className="mt-1 text-muted-foreground text-sm">Monitoreo y configuración general del servidor</p>
				</div>
				<Button className="gap-2" disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
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
							<CardTitle className="font-medium text-sm">CPU</CardTitle>
							<Cpu className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">{SYSTEM_STATS.cpu.usage}%</span>
								<span className="text-muted-foreground text-sm">{SYSTEM_STATS.cpu.cores} núcleos</span>
							</div>
							<Progress className="h-2" value={SYSTEM_STATS.cpu.usage} />
							<p className="text-muted-foreground text-sm">{SYSTEM_STATS.cpu.model}</p>
						</div>
					</CardContent>
				</Card>

				{/* Memory Card */}
				<Card className="border-l-4" style={{ borderLeftColor: 'var(--entity-tag)' }}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="font-medium text-sm">Memoria</CardTitle>
							<MemoryStick className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">{SYSTEM_STATS.memory.usage}%</span>
								<span className="text-muted-foreground text-sm">
									{SYSTEM_STATS.memory.used} / {SYSTEM_STATS.memory.total}
								</span>
							</div>
							<Progress className="h-2" value={SYSTEM_STATS.memory.usage} />
							<Badge className="w-fit text-sm" variant="outline">
								32GB DDR4
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* Disk Card */}
				<Card className="border-l-4" style={{ borderLeftColor: 'var(--entity-folder)' }}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="font-medium text-sm">Almacenamiento</CardTitle>
							<HardDrive className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">{SYSTEM_STATS.disk.usage}%</span>
								<span className="text-muted-foreground text-sm">
									{SYSTEM_STATS.disk.used} / {SYSTEM_STATS.disk.total}
								</span>
							</div>
							<Progress className="h-2" value={SYSTEM_STATS.disk.usage} />
							<p className="text-muted-foreground text-sm">NVMe SSD 512GB</p>
						</div>
					</CardContent>
				</Card>

				{/* Database Card */}
				<Card className="border-l-4" style={{ borderLeftColor: 'var(--entity-collection)' }}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="font-medium text-sm">Base de Datos</CardTitle>
							<Database className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">{SYSTEM_STATS.database.tables}</span>
								<span className="text-muted-foreground text-sm">tablas</span>
							</div>
							<div className="flex items-center gap-2">
								<Badge className="text-sm" variant="secondary">
									{SYSTEM_STATS.database.size}
								</Badge>
								<Badge className="text-sm" variant="outline">
									{SYSTEM_STATS.database.connections} conexiones
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Server Configuration Card */}
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
					<SettingsRow description="Máximo de memoria RAM por worker (MB)" label="Límite de memoria de workers">
						<Input className="w-24" defaultValue={512} type="number" />
					</SettingsRow>
				</SettingsGroup>

				<Separator className="my-4" />

				<SettingsGroup title="Nivel de Logging">
					<div className="space-y-3">
						{['error', 'warn', 'info', 'debug'].map((level) => (
							<div className="flex items-center justify-between" key={level}>
								<Label className="cursor-pointer" htmlFor={`log-${level}`}>
									{level.charAt(0).toUpperCase() + level.slice(1)}
								</Label>
								<input
									checked={logLevel === level}
									className="h-4 w-4 cursor-pointer accent-primary"
									id={`log-${level}`}
									name="log-level"
									onChange={() => setLogLevel(level)}
									type="radio"
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
						className="cursor-pointer hover:bg-muted/50"
						color="var(--entity-collection)"
						description="Configuración y mantenimiento de Drizzle ORM"
						icon={<Database />}
						title="Base de Datos"
					>
						<ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
					</SettingsCard>
				</CollapsibleTrigger>
				<CollapsibleContent className="space-y-4 pt-4">
					<SettingsGroup title="Backups Automáticos">
						<SettingsRow description="Crear copia de seguridad a las 02:00 AM" label="Activar backups diarios">
							<Switch defaultChecked />
						</SettingsRow>
						<SettingsRow description="Días a conservar" label="Retención de backups">
							<div className="flex items-center gap-2">
								<Input className="w-20" defaultValue={7} type="number" />
								<span className="text-muted-foreground text-sm">días</span>
							</div>
						</SettingsRow>
					</SettingsGroup>

					<Separator />

					<SettingsGroup title="Mantenimiento">
						<SettingsRow description="Ejecutar VACUUM semanalmente" label="Optimización automática">
							<Switch defaultChecked />
						</SettingsRow>
						<SettingsRow description="Ejecutar ANALYZE para actualizar estadísticas" label="Analizar tabla">
							<Button size="sm" variant="outline">
								<Eye className="mr-2 h-4 w-4" />
								Analizar
							</Button>
						</SettingsRow>
						<SettingsRow description="Limpiar caché de consultas" label="Vaciar caché">
							<Button size="sm" variant="destructive">
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
								<span className="font-medium text-foreground text-sm">Estado: Sano</span>
								<span className="text-muted-foreground text-sm">Último backup: hace 23h 45m</span>
							</div>
						</div>
						<Button size="sm" variant="outline">
							Ver logs
							<ChevronRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</CollapsibleContent>
			</Collapsible>

			{/* System Info Card */}
			<SettingsCard
				color="var(--entity-system)"
				description="Detalles técnicos y versión"
				icon={<Zap />}
				title="Información del Sistema"
				variant="outlined"
			>
				<div className="space-y-4">
					<SettingsRow label="Versión">
						<Badge variant="outline">{SYSTEM_STATS.version}</Badge>
					</SettingsRow>
					<SettingsRow label="Build">
						<span className="text-muted-foreground text-sm">{SYSTEM_STATS.build}</span>
					</SettingsRow>
					<SettingsRow label="Tiempo activo">
						<span className="font-medium text-foreground text-sm">{SYSTEM_STATS.uptime}</span>
					</SettingsRow>
					<Separator />
					<SettingsRow description="Buscar actualizaciones periódicamente" label="Actualización automática">
						<Switch defaultChecked />
					</SettingsRow>
					<Button className="w-full" variant="outline">
						<RefreshCw className="mr-2 h-4 w-4" />
						Ver actualizaciones
					</Button>
				</div>
			</SettingsCard>
		</div>
	);
}
