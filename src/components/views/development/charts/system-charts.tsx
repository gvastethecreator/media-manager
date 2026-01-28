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
		{ name: 'Imágenes', value: 8500, color: FILE_TYPE_COLORS.images },
		{ name: 'Videos', value: 2500, color: FILE_TYPE_COLORS.videos },
		{ name: 'Documentos', value: 1458, color: FILE_TYPE_COLORS.documents },
	];

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">Distribución de Archivos</CardTitle>
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
								formatter={(value) => [`${toNumberValue(value).toLocaleString()} archivos`, 'Cantidad']}
								labelFormatter={(name) => `Tipo: ${name}`}
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
		{ name: 'Lun', archivos: 450 },
		{ name: 'Mar', archivos: 520 },
		{ name: 'Mie', archivos: 380 },
		{ name: 'Jue', archivos: 650 },
		{ name: 'Vie', archivos: 420 },
		{ name: 'Sab', archivos: 580 },
		{ name: 'Dom', archivos: 720 },
	];

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">Actividad de Indexación</CardTitle>
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
								formatter={(value) => [`${toNumberValue(value)} archivos`, 'Indexados']}
								labelFormatter={(name) => `Día: ${name}`}
							/>
							<Area
								dataKey="archivos"
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
		{ name: 'CPU', valor: 45 },
		{ name: 'RAM', valor: 62 },
		{ name: 'Disco', valor: 78 },
		{ name: 'Red', valor: 25 },
	];

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">Uso de Recursos</CardTitle>
			</CardHeader>
			<CardContent className="p-2">
				<div className="h-[180px]">
					<ResponsiveContainer height="100%" width="100%">
						<BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
							<XAxis dataKey="name" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} width={30} />
							<CartesianGrid strokeDasharray="3 3" />
							<Tooltip
								formatter={(value) => [`${toNumberValue(value)}%`, 'Utilización']}
								labelFormatter={(name) => `Recurso: ${name}`}
							/>
							<Bar dataKey="valor" fill={CHART_COLORS.secondary} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

export function SystemPerformanceChart() {
	const data = [
		{ name: '00:00', valor: 85 },
		{ name: '04:00', valor: 92 },
		{ name: '08:00', valor: 78 },
		{ name: '12:00', valor: 65 },
		{ name: '16:00', valor: 88 },
		{ name: '20:00', valor: 95 },
	];

	return (
		<Card className="h-full border-2 border-primary/10">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">Rendimiento del Sistema</CardTitle>
			</CardHeader>
			<CardContent className="p-2">
				<div className="h-[180px]">
					<ResponsiveContainer height="100%" width="100%">
						<LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
							<XAxis dataKey="name" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} width={30} />
							<CartesianGrid strokeDasharray="3 3" />
							<Tooltip
								formatter={(value) => [`${toNumberValue(value)}/100`, 'Puntuación']}
								labelFormatter={(name) => `Hora: ${name}`}
							/>
							<Line dataKey="valor" stroke={CHART_COLORS.tertiary} strokeWidth={2} type="monotone" />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
