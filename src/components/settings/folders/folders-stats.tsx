import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FILE_TYPE_COLORS } from '@/lib/styles/chart-colors';
import type { FolderStats } from '@/types/folders';

interface FoldersStatsProps {
	stats: FolderStats;
}

export function FoldersStats({ stats }: FoldersStatsProps) {
	// Datos para gráfico de barras de distribución de archivos
	const barData = [
		{ name: 'Images', value: stats.totalImages, color: FILE_TYPE_COLORS.images },
		{ name: 'Videos', value: stats.totalVideos, color: FILE_TYPE_COLORS.videos },
		{ name: 'Audio', value: stats.totalAudio, color: FILE_TYPE_COLORS.audio },
		{ name: 'Docs', value: stats.totalDocuments, color: FILE_TYPE_COLORS.documents },
		{ name: 'Others', value: stats.totalOthers, color: FILE_TYPE_COLORS.others },
	]; // .filter((item) => item.value > 0); // Keep all to maintain the structure like the image

	// Datos simulados para tendencias (en un caso real vendrían del backend)
	// Usamos datos dummy basados en el total para que la gráfica se vea "viva"
	const total = stats.totalFiles || 100;
	const trendData = [
		{ name: 'Jan', count: Math.floor(total * 0.2) },
		{ name: 'Feb', count: Math.floor(total * 0.4) },
		{ name: 'Mar', count: Math.floor(total * 0.35) },
		{ name: 'Apr', count: Math.floor(total * 0.7) },
		{ name: 'May', count: Math.floor(total * 0.6) },
		{ name: 'Jun', count: total },
	];

	return (
		<div className="space-y-6" data-testid="folders-stats-inner">
			{/* Quick Stats Grid */}
			<div className="space-y-2">
				<h4 className="font-semibold text-sm opacity-90">Quick Stats</h4>
				<div className="grid grid-cols-2 gap-3">
					{/* Total Files */}
					<Card className="border-input bg-card/50 shadow-none">
						<CardContent className="p-3">
							<div className="flex flex-col gap-1">
								<span className="text-muted-foreground text-xs">Total Files</span>
								<span className="font-bold text-xl tracking-tight">{stats.totalFiles}</span>
							</div>
						</CardContent>
					</Card>

					{/* Storage Used */}
					<Card className="border-input bg-card/50 shadow-none">
						<CardContent className="p-3">
							<div className="flex flex-col gap-1">
								<span className="text-muted-foreground text-xs">Storage Used</span>
								<span className="font-bold text-xl tracking-tight">{stats.formattedSize}</span>
							</div>
						</CardContent>
					</Card>

					{/* Images */}
					<Card className="border-input bg-card/50 shadow-none">
						<CardContent className="p-3">
							<div className="flex flex-col gap-1">
								<span className="text-muted-foreground text-xs">Images</span>
								<span className="font-bold text-xl tracking-tight">{stats.totalImages}</span>
							</div>
						</CardContent>
					</Card>

					{/* Videos */}
					<Card className="border-input bg-card/50 shadow-none">
						<CardContent className="p-3">
							<div className="flex flex-col gap-1">
								<span className="text-muted-foreground text-xs">Videos</span>
								<span className="font-bold text-xl tracking-tight">{stats.totalVideos}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<Separator className="bg-border/40" />

			{/* Distribution Chart */}
			<div className="space-y-2">
				<h4 className="font-semibold text-sm opacity-90">Distribution by Type</h4>
				<div className="h-[200px] w-full">
					<ResponsiveContainer height="100%" width="100%">
						<BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
							<CartesianGrid stroke="hsl(var(--border) / 0.5)" strokeDasharray="3 3" vertical={false} />
							<XAxis
								axisLine={false}
								dataKey="name"
								dy={10}
								tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
								tickLine={false}
							/>
							<YAxis axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
							<Tooltip
								contentStyle={{
									fontSize: '12px',
									backgroundColor: 'hsl(var(--background))',
									border: '1px solid hsl(var(--border))',
									borderRadius: '6px',
								}}
								cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
								itemStyle={{ color: 'hsl(var(--foreground))' }}
							/>
							<Bar barSize={30} dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			<Separator className="bg-border/40" />

			{/* Trends Chart */}
			<div className="space-y-2">
				<h4 className="font-semibold text-sm opacity-90">Archive Trends</h4>
				<div className="h-[200px] w-full rounded-md border border-border/20 bg-gradient-to-b from-primary/5 to-transparent">
					<ResponsiveContainer height="100%" width="100%">
						<LineChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
							<defs>
								<linearGradient id="colorCount" x1="0" x2="0" y1="0" y2="1">
									<stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
									<stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid stroke="hsl(var(--border) / 0.3)" strokeDasharray="3 3" vertical={false} />
							<XAxis
								axisLine={false}
								dataKey="name"
								dy={10}
								tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
								tickLine={false}
							/>
							<YAxis axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
							<Tooltip
								contentStyle={{
									fontSize: '12px',
									backgroundColor: 'hsl(var(--background))',
									border: '1px solid hsl(var(--border))',
									borderRadius: '6px',
								}}
							/>
							<Line
								activeDot={{ r: 6 }}
								dataKey="count"
								dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }}
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								type="monotone"
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
