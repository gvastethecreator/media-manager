/**
 * @file Error Boundary Global
 * @description Manejo de errores de React con UI de recuperación
 */

import { AlertTriangle, Bug, Home, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from '@/components/ui/motion-shim';
import { clientLogger } from '@/lib/logger/client-logger';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	error: Error | null;
	errorInfo: ErrorInfo | null;
	hasError: boolean;
}

/**
 * UI de fallback cuando ocurre un error
 */
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
	const navigate = useNavigate();

	const handleGoHome = () => {
		navigate('/');
		onReset();
	};

	const handleReload = () => {
		window.location.reload();
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
			<motion.div
				animate={{ scale: 1, opacity: 1 }}
				className="mb-8"
				initial={{ scale: 0.8, opacity: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="flex h-32 w-32 items-center justify-center rounded-full bg-destructive/10">
					<AlertTriangle className="h-16 w-16 text-destructive" strokeWidth={1.5} />
				</div>
			</motion.div>

			<motion.h1
				animate={{ y: 0, opacity: 1 }}
				className="mb-4 text-center font-bold text-4xl text-foreground tracking-tight"
				initial={{ y: 20, opacity: 0 }}
				transition={{ delay: 0.1, duration: 0.5 }}
			>
				Something went wrong
			</motion.h1>

			<motion.p
				animate={{ y: 0, opacity: 1 }}
				className="mb-8 max-w-md text-center text-lg text-muted-foreground"
				initial={{ y: 20, opacity: 0 }}
				transition={{ delay: 0.2, duration: 0.5 }}
			>
				An unexpected error occurred. The team has been notified.
			</motion.p>

			{error && (
				<motion.div
					animate={{ y: 0, opacity: 1 }}
					className="mb-8 max-w-2xl overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-4"
					initial={{ y: 20, opacity: 0 }}
					transition={{ delay: 0.3, duration: 0.5 }}
				>
					<div className="flex items-center gap-2 font-mono text-destructive text-sm">
						<Bug className="h-4 w-4" />
						<span className="font-semibold">{error.name}</span>
					</div>
					<p className="mt-2 font-mono text-destructive/80 text-sm">{error.message}</p>
					{error.stack && (
						<pre className="mt-4 max-h-40 overflow-auto rounded bg-destructive/10 p-3 font-mono text-destructive/70 text-xs">
							{error.stack.split('\n').slice(0, 5).join('\n')}
						</pre>
					)}
				</motion.div>
			)}

			<motion.div
				animate={{ y: 0, opacity: 1 }}
				className="flex flex-wrap items-center justify-center gap-4"
				initial={{ y: 20, opacity: 0 }}
				transition={{ delay: 0.4, duration: 0.5 }}
			>
				<Button className="gap-2" onClick={handleReload} size="lg" variant="outline">
					<RefreshCw className="h-4 w-4" />
					Reload page
				</Button>
				<Button className="gap-2" onClick={handleGoHome} size="lg">
					<Home className="h-4 w-4" />
					Ir al inicio
				</Button>
			</motion.div>
		</div>
	);
}

/**
 * Error Boundary para manejar errores de React
 */
export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
		errorInfo: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error, errorInfo: null };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ errorInfo });

		// Log del error
		clientLogger.error('Error Boundary captured an error:', {
			error: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
		});

		// Callback opcional
		this.props.onError?.(error, errorInfo);
	}

	private readonly handleReset = () => {
		this.setState({ hasError: false, error: null, errorInfo: null });
	};

	public render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
