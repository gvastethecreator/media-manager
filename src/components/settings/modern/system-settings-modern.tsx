/**
 * @file Modern System Settings
 * @module components/settings/modern/system-settings-modern
 * @description Vista de configuración del sistema con diseño mejorado y datos reales
 */

import { CheckCircle, ChevronDown, Database, Eye, HardDrive, RefreshCw, Server, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useRepairSystem, useSystemStats, useSystemVersion } from '@/lib/api/system';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import {
	BentoGrid,
	SettingsCard,
	SettingsGroup,
	SettingsPageHeader,
	SettingsRow,
	SettingsStatsGrid,
} from '../modern/settings-card';

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
		version: versionData?.version || 'N/A',
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
			toastService.error('Could not repair the system');
		}
	};

	return (
		<div className="space-y-6">
			<SettingsPageHeader
				actions={
					<Button className="gap-2" disabled={isLoading} onClick={handleRefresh} size="sm" variant="outline">
						<RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
						Refresh
					</Button>
				}
				description="Monitor and configure the server"
				title="System Settings"
			/>

			{/* Stats Overview - 4 Real Data Cards */}
			<SettingsStatsGrid>
				{/* Storage Card - Real Data */}
				<Card
					className="overflow-hidden border-l bg-card/50"
					style={{ borderLeftColor: 'color-mix(in oklch, var(--entity-folder) 50%, transparent)' }}
				>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="font-medium text-sm">Storage</CardTitle>
							<HardDrive className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">{Math.round(diskUsagePercentage)}%</span>
								<span className="text-muted-foreground text-sm">in use</span>
							</div>
							<Progress className="h-2" value={diskUsagePercentage} />
							<p className="text-muted-foreground text-xs uppercase tracking-tight">
								{formatBytes(diskUsed)} used • {formatBytes(diskFree)} free
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
							<CardTitle className="font-medium text-sm">Total Files</CardTitle>
							<Database className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-3xl text-foreground">{stats.totalEntities}</span>
								<span className="text-muted-foreground text-sm">records</span>
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
							<CardTitle className="font-medium text-sm">Organization</CardTitle>
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
							<CardTitle className="font-medium text-sm">Database</CardTitle>
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
			</SettingsStatsGrid>

			<BentoGrid>
				{/* Server Configuration Card */}
				<div className="h-full md:col-span-2 xl:col-span-2" id="system-general">
					<SettingsCard
						className="h-full"
						color="var(--primary)"
						description="Performance and availability settings"
						icon={<Server />}
						title="Server Settings"
						variant="outlined"
					>
						<SettingsGroup title="Performance">
							<SettingsRow
								description="Refresh system metrics every 30 seconds"
								label="Automatic Statistics Refresh"
							>
								<Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
							</SettingsRow>
							<SettingsRow description="Cache frequently used queries" label="Query Cache">
								<Switch defaultChecked />
							</SettingsRow>
						</SettingsGroup>

						<Separator className="my-4" />

						<SettingsGroup title="Log Level">
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
				<div className="h-full md:col-span-2 xl:col-span-2" id="system-database">
					<Collapsible defaultOpen>
						<CollapsibleTrigger asChild>
							<SettingsCard
								className="cursor-pointer hover:bg-muted/50"
								color="var(--entity-collection)"
								description="Configure and maintain Drizzle ORM"
								icon={<Database />}
								title="Database Actions"
							>
								<ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
							</SettingsCard>
						</CollapsibleTrigger>
						<CollapsibleContent className="space-y-4 pt-4">
							<SettingsGroup title="Maintenance">
								<SettingsRow description="Verify integrity and repair indexes" label="Repair System">
									<Button disabled={repairSystemMutation.isPending} onClick={handleRepair} size="sm" variant="outline">
										<Eye className={cn('mr-2 h-4 w-4', repairSystemMutation.isPending && 'animate-spin')} />
										{repairSystemMutation.isPending ? 'Repairing...' : 'Run Repair'}
									</Button>
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
										<span className="font-medium text-foreground text-sm">Status: Connected</span>
										<span className="text-muted-foreground text-sm">Driver: SQLite-Drizzle</span>
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</div>

				{/* System Info Card */}
				<div className="h-full md:col-span-2 xl:col-span-4" id="system-storage">
					<SettingsCard
						className="h-full"
						color="var(--entity-system)"
						description="Technical details and version information"
						icon={<Zap />}
						title="System Information"
						variant="outlined"
					>
						<div className="space-y-4">
							<SettingsRow label="Version">
								<Badge variant="outline">{stats.version}</Badge>
							</SettingsRow>
							<SettingsRow label="Operating system">
								<Badge variant="outline">{stats.platform}</Badge>
							</SettingsRow>
							<SettingsRow label="Host">
								<span className="text-muted-foreground text-sm">{stats.hostname}</span>
							</SettingsRow>
							<SettingsRow label="Node/Bun runtime">
								<span className="text-muted-foreground text-sm">{stats.nodeVersion}</span>
							</SettingsRow>
							<SettingsRow label="Current CPU">
								<span className="text-muted-foreground text-sm">
									{stats.cpuUsage}% • {stats.cpuModel}
								</span>
							</SettingsRow>
							<SettingsRow label="Memory">
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
			</BentoGrid>
		</div>
	);
}
