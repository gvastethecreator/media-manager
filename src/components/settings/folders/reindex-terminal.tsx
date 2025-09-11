import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { AlertCircle, Check, Info, Terminal } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface LogEntry {
	id: string;
	timestamp: string;
	level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
	message: string;
	source?: string;
	folderId?: string;
	folderPath?: string;
	isFolderMain?: boolean; // Marca si es un log de carpeta principal (no progress ni complete)
	isSticky?: boolean; // Marca si debe ser sticky
}

interface ReindexTerminalProps {
	/** Si está en modo activo (mostrando logs en tiempo real) */
	isActive?: boolean;
	/** Clase CSS adicional */
	className?: string;
	/** Callback cuando se recibe un log */
	onLogReceived?: (log: LogEntry) => void;
	/** Logs iniciales */
	initialLogs?: LogEntry[];
	/** Progreso actual (0-100) */
	progress?: number;
	/** Si mostrar barra de progreso */
	showProgress?: boolean;
}

// Límite máximo de líneas para performance
const MAX_LINES = 25;

const LOG_ICONS = {
	INFO: Info,
	SUCCESS: Check,
	WARNING: AlertCircle,
	ERROR: AlertCircle,
} as const;

const LOG_COLORS = {
	INFO: 'text-blue-400',
	SUCCESS: 'text-green-400',
	WARNING: 'text-yellow-400',
	ERROR: 'text-red-400',
} as const;

/**
 * Componente que simula una terminal para mostrar logs de reindexado en tiempo real
 * Optimizado para mantener solo 100 líneas máximo con animaciones GSAP
 */
export function ReindexTerminal({
	isActive = false,
	className,
	onLogReceived,
	initialLogs = [],
	progress = 0,
	showProgress = true,
}: ReindexTerminalProps) {
	const [logs, setLogs] = useState<LogEntry[]>(initialLogs.slice(-MAX_LINES));
	const [currentProgress, setCurrentProgress] = useState(progress);
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [activeFolderLogId, setActiveFolderLogId] = useState<string | null>(null); // ID del log de carpeta activa
	const sseRef = useRef<EventSource | null>(null);
	const logCounterRef = useRef(0);
	const logContainerRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// GSAP Context para animaciones
	const { contextSafe } = useGSAP();

	// Formato de timestamp para terminal
	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('es-ES', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3,
		});
	};

	// Formatear tiempo transcurrido
	const formatElapsedTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m ${secs}s`;
		}
		if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		}
		return `${secs}s`;
	};

	// Animación para nuevas líneas
	const animateNewLog = contextSafe((element: HTMLElement) => {
		gsap.fromTo(
			element,
			{
				x: -20,
				opacity: 0,
				scale: 0.95,
			},
			{
				x: 0,
				opacity: 1,
				scale: 1,
				duration: 0.3,
				ease: 'back.out(1.7)',
			}
		);
	});

	// Agregar un nuevo log con límite de líneas y manejo de sticky
	const addLog = useCallback(
		(level: LogEntry['level'], message: string, data?: Partial<LogEntry>) => {
			const log: LogEntry = {
				id: `log-${Date.now()}-${++logCounterRef.current}`,
				timestamp: new Date().toISOString(),
				level,
				message,
				...data,
			};

			setLogs((prev) => {
				// Remover sticky de logs anteriores si esta es una nueva carpeta principal
				const updatedLogs = prev.map((l) => ({
					...l,
					isSticky: l.isSticky && !(log.isFolderMain && l.isFolderMain),
				}));

				// Si es un log de carpeta principal, actualizar el log activo
				if (log.isFolderMain) {
					setActiveFolderLogId(log.id);
					log.isSticky = true;
				}

				let newLogs = [...updatedLogs, log];

				// Si excede el límite, remover las más antiguas (pero mantener sticky si existe)
				if (newLogs.length > MAX_LINES) {
					const elementsToRemove = newLogs.length - MAX_LINES;
					const stickyLog = newLogs.find((l) => l.isSticky);

					if (stickyLog) {
						// Mantener el sticky y remover otros
						const nonStickyLogs = newLogs.filter((l) => !l.isSticky);
						const logsToKeep = nonStickyLogs.slice(elementsToRemove);
						newLogs = [stickyLog, ...logsToKeep];
					} else {
						newLogs = newLogs.slice(elementsToRemove);
					}
				}

				return newLogs;
			});

			onLogReceived?.(log);
		},
		[onLogReceived]
	);

	// Manejar eventos SSE del reindexado
	const handleSSEEvent = useCallback(
		(event: any) => {
			const { type, data } = event;

			switch (type) {
				case 'folder:reindexAll:start': {
					addLog('INFO', `🚀 Iniciando reindexado global de ${data.totalFolders || '?'} carpetas...`, {
						source: 'reindex-all',
					});
					// Iniciar el timer
					setStartTime(new Date());
					setCurrentProgress(0);
					break;
				}

				case 'folder:reindexAll:progress': {
					// Validar datos y proveer fallbacks para evitar undefined
					const processedFolders = data.filesProcessed ?? data.processedFolders ?? 0;
					const totalFolders = data.totalFiles ?? data.totalFolders ?? 0;
					const currentFolder = data.currentFolder ?? data.folderName ?? 'Procesando...';

					addLog('INFO', `📂 [${processedFolders}/${totalFolders}] ${currentFolder}`, {
						source: 'reindex-all',
						folderId: data.folderId,
						folderPath: data.currentFolder || data.folderPath,
						isFolderMain: true, // Este es un log de carpeta principal
					});
					// Actualizar progreso
					if (processedFolders > 0 && totalFolders > 0) {
						const progressPercent = (processedFolders / totalFolders) * 100;
						setCurrentProgress(progressPercent);
					}
					break;
				}

				case 'folder:progress': {
					const progressMsg = data.message || `Progreso: ${data.filesProcessed || 0}/${data.totalFiles || 0}`;
					addLog('INFO', `   └── ${progressMsg}`, {
						source: 'folder-progress',
						folderId: data.folderId,
						folderPath: data.folderPath,
					});
					break;
				}

				case 'folder:complete': {
					const stats = data.stats || {};
					addLog('SUCCESS', `✅ Completado: ${data.folderPath || 'carpeta'} (${stats.totalImages || 0} imágenes)`, {
						source: 'folder-complete',
						folderId: data.folderId,
						folderPath: data.folderPath,
					});
					// Remover sticky del log actual ya que la carpeta terminó
					setActiveFolderLogId(null);
					break;
				}

				case 'folder:error': {
					addLog('ERROR', `❌ Error en ${data.folderPath || 'carpeta'}: ${data.error || 'Error desconocido'}`, {
						source: 'folder-error',
						folderId: data.folderId,
						folderPath: data.folderPath,
					});
					break;
				}

				case 'folder:reindexAll:complete': {
					const duration = data.duration ? `en ${Math.round(data.duration / 1000)}s` : '';
					addLog('SUCCESS', `🎉 Reindexado global completado ${duration}`, {
						source: 'reindex-all',
					});
					// Completar progreso
					setCurrentProgress(100);
					break;
				}

				default: {
					// Otros eventos relacionados con folders
					if (type.startsWith('folder:')) {
						addLog('INFO', `📡 Evento: ${type}`, { source: 'events' });
					}
				}
			}
		},
		[addLog]
	);

	// Actualizar tiempo transcurrido
	useEffect(() => {
		if (!startTime) return;

		timerRef.current = setInterval(() => {
			const now = new Date();
			const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
			setElapsedTime(elapsed);
		}, 1000);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [startTime]);

	// Configurar conexión SSE cuando está activo
	useEffect(() => {
		if (!isActive) return;

		addLog('INFO', '🔌 Conectando al servidor de eventos...', { source: 'terminal' });

		const eventSource = new EventSource('/api/events/stream');
		sseRef.current = eventSource;

		eventSource.onopen = () => {
			addLog('SUCCESS', '✅ Conexión establecida con el servidor', { source: 'sse' });
		};

		eventSource.addEventListener('connected', (e) => {
			const data = JSON.parse(e.data);
			addLog('SUCCESS', '🎯 Suscrito a eventos de reindexado', {
				source: 'sse',
				timestamp: new Date(data.timestamp).toISOString(),
			});
		});

		eventSource.addEventListener('event', (e) => {
			try {
				const event = JSON.parse(e.data);
				handleSSEEvent(event);
			} catch (error) {
				console.error('Error parsing SSE event:', error);
				addLog('ERROR', '❌ Error procesando evento del servidor', { source: 'sse' });
			}
		});

		eventSource.addEventListener('heartbeat', () => {
			// Opcional: mostrar heartbeat
			// addLog('INFO', '💓 Heartbeat', { source: 'sse' });
		});

		eventSource.onerror = (error) => {
			console.error('SSE Error:', error);
			addLog('WARNING', '⚠️  Conexión perdida, intentando reconectar...', { source: 'sse' });
		};

		return () => {
			if (sseRef.current) {
				sseRef.current.close();
				sseRef.current = null;
			}
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [isActive, addLog, handleSSEEvent]);

	// Animar nuevos logs cuando se agregan
	useEffect(() => {
		if (logContainerRef.current && logs.length > 0) {
			const lastLog = logContainerRef.current.lastElementChild as HTMLElement;
			if (lastLog && animateNewLog) {
				animateNewLog(lastLog);
			}
		}
	}, [logs.length, animateNewLog]);

	// Renderizar entrada de log con soporte para sticky
	const renderLogEntry = (log: LogEntry, index: number) => {
		const Icon = LOG_ICONS[log.level];
		const colorClass = LOG_COLORS[log.level];

		return (
			<div
				className={cn(
					'flex h-6 items-center gap-3 p-1',
					log.isSticky && {
						'sticky top-0 z-10 border-gray-700/50 py-3 shadow-lg backdrop-blur-sm': true,
						'bg-gradient-to-r from-blue-900/20 to-transparent': true,
						'ring-1 ring-blue-500/20': true,
					}
				)}
				data-sticky={log.isSticky}
				key={log.id}
			>
				<span className="font-mono text-gray-500 text-xs tabular-nums">{formatTimestamp(log.timestamp)}</span>
				<Icon className={cn('h-3 w-3 flex-shrink-0', colorClass)} />
				<span
					className={cn(
						'overflow-hidden break-words font-mono text-sm leading-tight',
						log.isSticky ? 'font-medium text-gray-50' : 'text-gray-100'
					)}
				>
					{log.message}
				</span>
			</div>
		);
	};

	return (
		<div className={cn('h-full w-full', className)}>
			{/* Terminal con soporte para sticky logs - usando todo el ancho disponible */}
			<div className="relative h-full w-full overflow-y-auto rounded-sm bg-black p-4">
				{logs.length === 0 ? (
					<div className="flex items-center justify-center p-4 text-gray-500">
						<Terminal className="mr-2 h-4 w-4" />
						<span className="font-mono text-sm">Esperando logs...</span>
					</div>
				) : (
					<div className="w-full space-y-1" ref={logContainerRef}>
						{logs.map((log, index) => renderLogEntry(log, index))}
					</div>
				)}
			</div>
		</div>
	);
}
