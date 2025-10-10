/**
 * Métricas de rendimiento para procesamiento de media
 * Escribe métricas simples en logs/metrics-media.jsonl para análisis posterior
 */
export class MetricsCollector {
	private start: number;
	private phases: Record<string, number[]>;

	constructor() {
		this.start = Date.now();
		this.phases = {};
	}

	/**
	 * Registra la duración de una fase de procesamiento
	 */
	recordPhase(name: string, startedAt: number): void {
		const dur = Date.now() - startedAt;
		if (!this.phases[name]) {
			this.phases[name] = [];
		}
		this.phases[name].push(dur);
	}

	/**
	 * Escribe métricas a disco (minimizar I/O: sólo al final)
	 */
	async flushMetrics(): Promise<void> {
		try {
			const fs = await import('node:fs');
			const line = `${JSON.stringify({ ts: new Date().toISOString(), phases: this.phases })}\n`;
			fs.appendFileSync('logs/metrics-media.jsonl', line);
		} catch {
			/* ignore - no fallar por logging */
		}
	}

	/**
	 * Obtiene el tiempo total transcurrido desde el inicio
	 */
	getElapsedTime(): number {
		return Date.now() - this.start;
	}

	/**
	 * Resetea las métricas (útil para tests)
	 */
	reset(): void {
		this.start = Date.now();
		this.phases = {};
	}
}
