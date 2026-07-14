import React from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { GlobalErrorFallback } from './global-error-handler';

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	lastLogContent?: { file: string; lines: string[] };
}

interface ErrorBoundaryState {
	error: Error | null;
	hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		if (import.meta.env.DEV) {
			clientLogger.error('Error capturado por ErrorBoundary:', { error, errorInfo });
		}
	}

	handleReload = () => {
		this.setState({ hasError: false, error: null });
	};

	getAffectedFiles(stack?: string): Array<{ file: string; line: string }> {
		if (!stack) {
			return [];
		}
		const regex = /\(?([\w./\\:-]+\.(ts|tsx|js|jsx)):(\d+):(\d+)\)?/g;
		const files: Array<{ file: string; line: string }> = [];
		let match: RegExpExecArray | null = regex.exec(stack);
		while (match !== null) {
			files.push({ file: match[1], line: match[3] });
			match = regex.exec(stack);
		}
		return files;
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Render GlobalErrorFallback if no specific fallback is provided
			if (this.state.error) {
				const stack = this.state.error.stack || '';
				const affectedFiles = this.getAffectedFiles(stack);
				const envInfo = {
					version: import.meta.env.VITE_APP_VERSION || 'desconocida',
					branch: (import.meta as any).env?.VITE_GIT_BRANCH || 'desconocida',
					date: new Date().toLocaleString(),
					path: window.location.pathname,
				};

				// In production, just show the generic fallback.
				if (import.meta.env.PROD) {
					return <GlobalErrorFallback error={this.state.error} resetError={this.handleReload} />;
				}

				// In development, show the detailed error UI.
				return (
					<div className="flex h-full flex-row items-stretch justify-center gap-8 bg-background p-8 text-foreground">
						<div className="flex max-w-2xl flex-1 flex-col items-center justify-center">
							<div className="flex w-full flex-col items-center rounded-xl border border-border/50 bg-card p-8 shadow-lg">
								<h1 className="mb-4 font-bold text-3xl text-destructive">¡Algo salió mal!</h1>
								<p className="mb-4 text-foreground/80">Intenta recargar la página o reporta el error.</p>
								<button className="btn btn-primary mb-4" onClick={this.handleReload} type="button">
									Recargar
								</button>
								<div className="mt-4 flex w-full flex-col items-start gap-6">
									<div className="w-full rounded-lg border border-border/50 bg-background p-4">
										<strong className="text-destructive/80">Archivos afectados:</strong>
										<ul className="mt-2 ml-6 list-disc text-foreground/80 text-xs">
											{affectedFiles.length === 0 && <li>No detectados en el stack trace.</li>}
											{affectedFiles.map((f) => (
												<li key={`${f.file}:${f.line}`}>
													<span className="font-mono text-info">
														{f.file}:{f.line}
													</span>
												</li>
											))}
										</ul>
									</div>
									<div className="w-full rounded-lg border border-border/50 bg-background p-4">
										<div className="mb-2 flex items-center">
											<strong className="text-info">Stack trace:</strong>
											<button
												className="ml-2 text-info/80 text-xs underline hover:text-info"
												onClick={() => navigator.clipboard.writeText(stack)}
												type="button"
											>
												Copiar
											</button>
										</div>
										<pre className="mt-2 max-w-xl overflow-x-auto rounded bg-card p-2 text-foreground/80 text-xs">
											{stack}
										</pre>
									</div>
									<div className="w-full rounded-lg border border-border/50 bg-background p-4">
										<strong className="text-success">Información de entorno:</strong>
										<ul className="mt-2 ml-4 text-foreground/80 text-xs">
											<li>
												Versión: <span className="font-mono text-success/80">{envInfo.version}</span>
											</li>
											<li>
												Rama: <span className="font-mono text-success/80">{envInfo.branch}</span>
											</li>
											<li>
												Fecha: <span className="font-mono text-success/80">{envInfo.date}</span>
											</li>
											<li>
												Ruta: <span className="font-mono text-success/80">{envInfo.path}</span>
											</li>
										</ul>
									</div>
									<div className="w-full rounded-lg border border-border/50 bg-background p-4">
										<strong className="text-warning">Estado de stores (debug):</strong>
										<pre className="mt-2 max-h-40 overflow-auto rounded bg-card p-2 text-warning/80 text-xs">
											{JSON.stringify(
												{ /* TODO: dump real de stores aquí */ demo: 'Implementa aquí el snapshot de Zustand o Redux' },
												null,
												2
											)}
										</pre>
									</div>
								</div>
							</div>
						</div>
						{this.props.lastLogContent && (
							<aside className="flex w-[420px] max-w-full flex-col overflow-auto rounded-lg border-border/30 border-l bg-muted p-4 shadow-inner">
								<h2 className="mb-2 font-semibold text-foreground/80 text-sm">
									Último log: <span className="font-mono text-info text-xs">{this.props.lastLogContent.file}</span>
								</h2>
								<pre className="max-h-[400px] overflow-auto rounded bg-background p-2 text-foreground/70 text-xs">
									{this.props.lastLogContent.lines.join('\n')}
								</pre>
							</aside>
						)}
					</div>
				);
			}
		}
		return this.props.children;
	}
}

export function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, fallback: React.ReactNode) {
	return function WithErrorBoundary(props: P) {
		return (
			<ErrorBoundary fallback={fallback}>
				<Component {...props} />
			</ErrorBoundary>
		);
	};
}
