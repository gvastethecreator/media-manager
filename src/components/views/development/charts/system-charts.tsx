import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS, FILE_TYPE_COLORS } from '@/lib/styles/chart-colors';

function toNumberValue(value: unknown): number {
	if (Array.isArray(value)) return Number(value[0] ?? 0);
	return Number(value ?? 0);
}

export function FileDistributionChart() {
	const data = [
		{ name: 'Images', value: 8500, color: FILE_TYPE_COLORS.images },
		{ name: 'Videos', value: 2500, color: FILE_TYPE_COLORS.videos },
		{ name: 'Documents', value: 1458, color: FILE_TYPE_COLORS.documents },
	];

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">File Distribution</CardTitle>
			</CardHeader>
			<CardContent className="p-2">
				<div className="h-[180px]">
					<ResponsiveContainer height="100%" width="100%">
						<PieChart>
							<Pie
								cx="50%"
								cy="50%"
								data={data}
								dataKey="value"
								fill={CHART_COLORS.quaternary}
								innerRadius={50}
								outerRadius={70}
								paddingAngle={5}
							>
								{data.map((entry) => (
									<Cell fill={entry.color} key={`cell-${entry.name}`} />
								))}
							</Pie>
							<Tooltip
								formatter={(value) => [`${toNumberValue(value).toLocaleString()} files`, 'Count']}
								labelFormatter={(name) => `Type: ${name}`}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

export function IndexingActivityChart() {
	const data = [
		{ name: 'Mon', files: 450 },
		{ name: 'Tue', files: 520 },
		{ name: 'Wed', files: 380 },
		{ name: 'Thu', files: 650 },
		{ name: 'Fri', files: 420 },
		{ name: 'Sat', files: 580 },
		{ name: 'Sun', files: 720 },
	];

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">Indexing Activity</CardTitle>
			</CardHeader>
			<CardContent className="p-2">
				<div className="h-[180px]">
					<ResponsiveContainer height="100%" width="100%">
						<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
							<defs>
								<linearGradient id="colorArchivos" x1="0" x2="0" y1="0" y2="1">
									<stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
									<stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
								</linearGradient>
							</defs>
							<XAxis dataKey="name" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} width={30} />
							<CartesianGrid strokeDasharray="3 3" />
							<Tooltip
								formatter={(value) => [`${toNumberValue(value)} files`, 'Indexed']}
								labelFormatter={(name) => `Day: ${name}`}
							/>
							<Area
								dataKey="files"
								fill="url(#colorArchivos)"
								fillOpacity={1}
								stroke={CHART_COLORS.primary}
								type="monotone"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

export function ResourceUsageChart() {
	const data = [
		{ name: 'CPU', value: 45 },
		{ name: 'RAM', value: 62 },
		{ name: 'Disk', value: 78 },
		{ name: 'Network', value: 25 },
	];

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">Resource Usage</CardTitle>
			</CardHeader>
			<CardContent className="p-2">
				<div className="h-[180px]">
					<ResponsiveContainer height="100%" width="100%">
						<BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
							<XAxis dataKey="name" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} width={30} />
							<CartesianGrid strokeDasharray="3 3" />
							<Tooltip
								formatter={(value) => [`${toNumberValue(value)}%`, 'Utilization']}
								labelFormatter={(name) => `Resource: ${name}`}
							/>
							<Bar dataKey="value" fill={CHART_COLORS.secondary} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

export function SystemPerformanceChart() {
	const data = [
		{ name: '00:00', value: 85 },
		{ name: '04:00', value: 92 },
		{ name: '08:00', value: 78 },
		{ name: '12:00', value: 65 },
		{ name: '16:00', value: 88 },
		{ name: '20:00', value: 95 },
	];

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">System Performance</CardTitle>
			</CardHeader>
			<CardContent className="p-2">
				<div className="h-[180px]">
					<ResponsiveContainer height="100%" width="100%">
						<LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
							<XAxis dataKey="name" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} width={30} />
							<CartesianGrid strokeDasharray="3 3" />
							<Tooltip
								formatter={(value) => [`${toNumberValue(value)}/100`, 'Score']}
								labelFormatter={(name) => `Time: ${name}`}
							/>
							<Line dataKey="value" stroke={CHART_COLORS.tertiary} strokeWidth={2} type="monotone" />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
