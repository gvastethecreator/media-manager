import React from 'react';
import packageJson from '../../../package.json';
import { GlobalErrorFallback } from '../global-error-handler';

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	lastLogContent?: { file: string; lines: string[] };
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
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
		if (process.env.NODE_ENV !== 'production') {
			console.error('Error capturado por ErrorBoundary:', error, errorInfo);
		}
	}

	handleReload = () => {
		this.setState({ hasError: false, error: null });
	};

	getAffectedFiles(stack?: string): Array<{ file: string; line: string }> {
		if (!stack) return [];
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
			if (this.props.fallback) return this.props.fallback;
			// Render GlobalErrorFallback if no specific fallback is provided
			if (this.state.error) {
				return <GlobalErrorFallback error={this.state.error} resetError={this.handleReload} />;
			}
			const stack = this.state.error?.stack || '';
			const affectedFiles = this.getAffectedFiles(stack);
			const envInfo = {
				version: packageJson.version,
				branch: (import.meta as any).env?.VITE_GIT_BRANCH || 'desconocida',
				date: new Date().toLocaleString(),
				path: window.location.pathname,
			};
			return (
				<div className="flex flex-row items-stretch justify-center h-full p-8 gap-8 bg-neutral-900 text-neutral-100">
					<div className="flex flex-col items-center justify-center flex-1 max-w-2xl">
						<div className="bg-neutral-800 rounded-xl shadow-lg p-8 w-full flex flex-col items-center border border-neutral-700">
							<h1 className="text-3xl font-bold mb-4 text-red-400">¡Algo salió mal!</h1>
							<p className="mb-4 text-neutral-200">Intenta recargar la página o reporta el error.</p>
							<button type="button" onClick={this.handleReload} className="btn btn-primary mb-4">
								Recargar
							</button>
							{process.env.NODE_ENV !== 'production' && this.state.error && (
								<div className="w-full mt-4 flex flex-col gap-6 items-start">
									<div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-full">
										<strong className="text-red-300">Archivos afectados:</strong>
										<ul className="list-disc ml-6 text-xs mt-2 text-neutral-200">
											{affectedFiles.length === 0 && <li>No detectados en el stack trace.</li>}
											{affectedFiles.map((f) => (
												<li key={`${f.file}:${f.line}`}>
													<span className="font-mono text-blue-300">
														{f.file}:{f.line}
													</span>
												</li>
											))}
										</ul>
									</div>
									<div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-full">
										<div className="flex items-center mb-2">
											<strong className="text-blue-300">Stack trace:</strong>
											<button
												type="button"
												className="ml-2 text-xs underline text-blue-400 hover:text-blue-200"
												onClick={() => navigator.clipboard.writeText(stack)}
											>
												Copiar
											</button>
										</div>
										<pre className="bg-neutral-800 p-2 rounded text-xs max-w-xl overflow-x-auto mt-2 text-neutral-200">
											{stack}
										</pre>
									</div>
									<div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-full">
										<strong className="text-green-300">Información de entorno:</strong>
										<ul className="text-xs ml-4 mt-2 text-neutral-200">
											<li>
												Versión: <span className="font-mono text-green-200">{envInfo.version}</span>
											</li>
											<li>
												Rama: <span className="font-mono text-green-200">{envInfo.branch}</span>
											</li>
											<li>
												Fecha: <span className="font-mono text-green-200">{envInfo.date}</span>
											</li>
											<li>
												Ruta: <span className="font-mono text-green-200">{envInfo.path}</span>
											</li>
										</ul>
									</div>
									<div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-full">
										<strong className="text-yellow-300">Estado de stores (debug):</strong>
										<pre className="text-xs bg-neutral-800 rounded p-2 mt-2 text-yellow-200 max-h-40 overflow-auto">
											{JSON.stringify(
												{ /* TODO: dump real de stores aquí */ demo: 'Implementa aquí el snapshot de Zustand o Redux' },
												null,
												2
											)}
										</pre>
									</div>
								</div>
							)}
						</div>
					</div>
					{this.props.lastLogContent && (
						<aside className="w-[420px] max-w-full bg-neutral-950 border-l border-neutral-800 p-4 overflow-auto rounded-lg shadow-inner flex flex-col">
							<h2 className="font-semibold text-sm mb-2 text-neutral-200">
								Último log: <span className="font-mono text-xs text-blue-300">{this.props.lastLogContent.file}</span>
							</h2>
							<pre className="text-xs bg-neutral-900 rounded p-2 max-h-[400px] overflow-auto text-neutral-300">
								{this.props.lastLogContent.lines.join('\n')}
							</pre>
						</aside>
					)}
				</div>
			);
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
