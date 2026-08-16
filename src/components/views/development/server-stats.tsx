import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemStatsExtended as useSystemStats } from '@/lib/api/stats';
import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger.withContext('ServerStats');

function formatBytes(bytes?: number) {
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

function formatUptime(seconds?: number) {
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

export function ServerStats() {
	const [activeTab, setActiveTab] = useState('system');
	const { data: statsData, isLoading: loading, error, refetch: fetchStats } = useSystemStats();

	const totalEntities = statsData
		? statsData.totalImages +
			statsData.totalVideos +
			statsData.totalAudio +
			statsData.totalDocuments +
			statsData.totalJsonFiles +
			statsData.totalFile3D +
			statsData.totalFolders +
			statsData.totalAlbums +
			statsData.totalCollections +
			statsData.totalTags +
			statsData.totalCharacters +
			statsData.totalPlaces +
			statsData.totalConcepts +
			statsData.totalPrompts +
			statsData.totalNotes +
			statsData.totalProperties +
			statsData.totalWildcards +
			statsData.totalWorldItems
		: 0;

	const handleRefresh = useCallback(() => {
		logger.info('🔄 Refreshing server statistics');
		fetchStats();
	}, [fetchStats]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-2xl">Server Statistics</h2>
				<Button
					className="flex items-center gap-2"
					disabled={loading}
					onClick={handleRefresh}
					size="sm"
					type="button"
					variant="outline"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
					Refresh
				</Button>
			</div>

			{error && (
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<p className="text-destructive">
							{error instanceof Error ? error.message : 'Could not load statistics'}
						</p>
					</CardContent>
				</Card>
			)}

			<Tabs onValueChange={setActiveTab} value={activeTab}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="system">System</TabsTrigger>
					<TabsTrigger value="app">Application</TabsTrigger>
				</TabsList>

				<TabsContent className="mt-4 space-y-4" value="system">
					{statsData ? (
						<>
							<Card>
								<CardHeader>
									<CardTitle>System Information</CardTitle>
									<CardDescription>Live host and runtime data</CardDescription>
								</CardHeader>
								<CardContent className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-muted-foreground text-sm">Platform</p>
										<p className="font-medium">{statsData.platform || 'N/A'}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Runtime</p>
										<p className="font-medium">{statsData.nodeVersion || 'N/A'}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Host</p>
										<p className="font-medium">{statsData.hostname || 'N/A'}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">Uptime</p>
										<p className="font-medium">{formatUptime(statsData.uptime)}</p>
									</div>
									<div className="col-span-2">
										<p className="text-muted-foreground text-sm">CPU</p>
										<p className="font-medium">
											{statsData.cpuModel || 'N/A'} ({statsData.cpuCores || 0} cores)
										</p>
									</div>
								</CardContent>
							</Card>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>CPU</CardTitle>
										<CardDescription>Current processor load</CardDescription>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Usage</span>
											<span className="font-medium">{(statsData.cpuUsage || 0).toFixed(1)}%</span>
										</div>
										<Progress className="h-2" value={statsData.cpuUsage || 0} />
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Memory</CardTitle>
										<CardDescription>Live RAM usage</CardDescription>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Total</span>
											<span>{formatBytes(statsData.memoryTotal)}</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Used</span>
											<span>{formatBytes(statsData.memoryUsed)}</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Free</span>
											<span>{formatBytes(statsData.memoryFree)}</span>
										</div>
										<Progress className="mt-2 h-2" value={statsData.memoryUsage || 0} />
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Disk</CardTitle>
									<CardDescription>Live machine storage usage</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Total</span>
										<span>{formatBytes(statsData.diskUsage?.total)}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Used</span>
										<span>{formatBytes(statsData.diskUsage?.used)}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Free</span>
										<span>{formatBytes(statsData.diskUsage?.free)}</span>
									</div>
									<Progress className="mt-2 h-2" value={statsData.diskUsage?.usedPercentage || 0} />
								</CardContent>
							</Card>
						</>
					) : loading ? (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">Loading system statistics...</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">System statistics could not be loaded</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent className="mt-4 space-y-4" value="app">
					{statsData ? (
						<>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Library</CardTitle>
										<CardDescription>Live indexed totals</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="rounded-lg border bg-muted/40 p-3 text-center">
												<p className="font-bold text-2xl">{statsData.totalImages}</p>
												<p className="text-muted-foreground text-sm">Images</p>
											</div>
											<div className="rounded-lg border bg-muted/40 p-3 text-center">
												<p className="font-bold text-2xl">{statsData.totalVideos}</p>
												<p className="text-muted-foreground text-sm">Videos</p>
											</div>
										</div>
										<div className="text-center">
											<p className="text-muted-foreground text-sm">Total entities</p>
											<p className="font-semibold text-lg">{totalEntities}</p>
											<Badge className="mt-1" variant="secondary">
												{statsData.totalFavorites} favorites
											</Badge>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Indexed Storage</CardTitle>
										<CardDescription>Actual size recorded by the application</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Indexed files</span>
											<span className="font-medium">{formatBytes(statsData.usedSpace)}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">System disk used</span>
											<span className="font-medium">{formatBytes(statsData.storageUsed)}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Free space</span>
											<span className="font-medium">{formatBytes(statsData.storageAvailable)}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Average per file</span>
											<span className="font-medium">{formatBytes(statsData.averageFileSize)}</span>
										</div>
									</CardContent>
								</Card>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Database</CardTitle>
										<CardDescription>Persisted size and artifacts</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Estimated DB size</span>
											<span className="font-medium">
												{statsData.formattedDatabaseSize || formatBytes(statsData.databaseSize)}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Metadata</span>
											<span className="font-medium">{statsData.totalMetadata}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Thumbnails</span>
											<span className="font-medium">{statsData.totalThumbnails}</span>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Organization</CardTitle>
										<CardDescription>Organization and worldbuilding entities</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Albums / collections</span>
											<span className="font-medium">
												{statsData.totalAlbums} / {statsData.totalCollections}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Tags / properties</span>
											<span className="font-medium">
												{statsData.totalTags} / {statsData.totalProperties}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Characters / places / items</span>
											<span className="font-medium">
												{statsData.totalCharacters} / {statsData.totalPlaces} / {statsData.totalWorldItems}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-sm">Concepts / prompts / notes / wildcards</span>
											<span className="font-medium">
												{statsData.totalConcepts} / {statsData.totalPrompts} / {statsData.totalNotes} /{' '}
												{statsData.totalWildcards}
											</span>
										</div>
									</CardContent>
								</Card>
							</div>
						</>
					) : loading ? (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">Loading application statistics...</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="pt-6">
								<p className="text-center text-muted-foreground">
									Application statistics could not be loaded
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
