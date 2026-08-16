import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Regex reutilizable para filtrar medidas relevantes
const PERF_DEFAULT_FILTER = /(grid|cards)-view-initial-render/;

interface PerfEntryInfo {
	duration: number;
	entryType: string;
	name: string;
	startTime: number;
}

interface PerformanceMetricsPanelProps {
	autoUpdateMs?: number;
	className?: string;
	filter?: RegExp;
}

// Panel ligero para mostrar medidas performance.measure creadas en runtime.
export const PerformanceMetricsPanel: React.FC<PerformanceMetricsPanelProps> = ({
	filter = PERF_DEFAULT_FILTER,
	className,
	autoUpdateMs = 2000,
}) => {
	const [entries, setEntries] = useState<PerfEntryInfo[]>([]);
	const [lastUpdated, setLastUpdated] = useState<number>(() => Date.now());

	const readEntries = useCallback(() => {
		try {
			const measures = performance.getEntriesByType('measure');
			const filtered = measures
				.filter((m) => filter.test(m.name))
				.map((m) => ({
					name: m.name,
					// duration y startTime pueden ser 0 si falla mark: normalizar a 0.x ms
					duration: Number.isFinite(m.duration) ? m.duration : 0,
					startTime: Number.isFinite(m.startTime) ? m.startTime : 0,
					entryType: m.entryType,
				}))
				// ordenar por nombre consistente y luego por startTime
				.sort((a, b) => a.name.localeCompare(b.name) || a.startTime - b.startTime);
			setEntries(filtered as PerfEntryInfo[]);
			setLastUpdated(Date.now());
		} catch {
			// silencio
		}
	}, [filter]);

	useEffect(() => {
		readEntries();
		if (autoUpdateMs > 0) {
			const id = setInterval(readEntries, autoUpdateMs);
			return () => clearInterval(id);
		}
		return;
	}, [readEntries, autoUpdateMs]);

	const handleClear = useCallback(() => {
		try {
			// No existe API directa para limpiar measures específicos sin clearMarks; se limpia todo.
			performance.clearMeasures();
			performance.clearMarks();
		} catch {
			// noop
		}
		readEntries();
	}, [readEntries]);

	const totalDuration = useMemo(() => entries.reduce((acc, e) => acc + e.duration, 0), [entries]);

	if (entries.length === 0) {
		return (
			<div
				className={['rounded-md border bg-background/70 p-3 text-xs shadow-sm backdrop-blur', className]
					.filter(Boolean)
					.join(' ')}
				data-testid="performance-metrics-panel"
			>
				<div className="mb-1 font-medium">Performance</div>
				<div className="text-muted-foreground">No measurements yet.</div>
				<button
					className="mt-2 rounded border px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground"
					onClick={readEntries}
					type="button"
				>
					Refresh
				</button>
			</div>
		);
	}

	return (
		<div
			className={['rounded-md border bg-background/70 p-3 text-xs shadow-sm backdrop-blur', className]
				.filter(Boolean)
				.join(' ')}
			data-testid="performance-metrics-panel"
		>
			<div className="mb-2 flex items-center justify-between">
				<span className="font-medium">Performance</span>
				<div className="flex gap-2">
					<button
						className="rounded border px-2 py-0.5 hover:bg-accent hover:text-accent-foreground"
						onClick={readEntries}
						type="button"
					>
						↻
					</button>
					<button
						className="rounded border px-2 py-0.5 hover:bg-destructive hover:text-destructive-foreground"
						onClick={handleClear}
						type="button"
					>
						Reset
					</button>
				</div>
			</div>
			<div className="space-y-1">
				{entries.map((e) => (
					<div className="flex items-center justify-between gap-4" key={e.name}>
						<span className="truncate" title={e.name}>
							{e.name}
						</span>
						<span className="tabular-nums">{e.duration.toFixed(2)} ms</span>
					</div>
				))}
			</div>
			<div className="mt-2 flex items-center justify-between border-t pt-1">
				<span className="text-muted-foreground">Total</span>
				<span className="font-medium tabular-nums">{totalDuration.toFixed(2)} ms</span>
			</div>
			<div className="mt-1 text-[10px] text-muted-foreground">
				Updated: {new Date(lastUpdated).toLocaleTimeString()}
			</div>
		</div>
	);
};
