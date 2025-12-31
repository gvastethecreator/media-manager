import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { AlertCircle, Check, Info, Terminal } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
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
// Configuración de reconexión SSE
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 segundo inicial
const MAX_RECONNECT_DELAY = 30_000; // 30 segundos máximo

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
	const reconnectAttemptRef = useRef(0);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isConnectingRef = useRef(false);

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
					const phase = data.phase || 'processing';
					const progress = data.progress || 0;

					// Detectar si es un log de archivo individual (mensaje empieza con └──)
					const isFileLog = progressMsg.includes('└──');

					// Determinar icono y nivel según fase
					let icon = '└──';
					let level: LogEntry['level'] = 'INFO';

					if (phase === 'starting') icon = '🚀';
					else if (phase === 'analysis') icon = '📊';
					else if (phase === 'existence') icon = '🔍';
					else if (phase === 'deletion') icon = '🗑️';
					else if (phase === 'structure') icon = '🌳';
					else if (phase === 'processing') {
						// Para archivos individuales
						if (isFileLog) {
							// Log de archivo individual (no sticky)
							addLog('INFO', progressMsg, {
								source: 'file-processing',
								folderId: data.folderId,
								folderPath: data.folderPath,
							});

							// Actualizar progreso con granularidad fina
							// Base 45% + progreso proporcional de archivos en carpeta actual
							if (progress > 0 && data.totalFiles > 0) {
								const folderProgress = progress / 100;
								// Asumiendo que indexing ocupa 15% del total (45% a 60%)
								setCurrentProgress(45 + folderProgress * 15);
							}
							break; // Salir temprano para no duplicar
						}

						// Para carpetas principales (sin └──)
						if (data.folderId && !isFileLog) {
							icon = '📁';
							// Log de carpeta principal (sticky)
							addLog('INFO', progressMsg, {
								source: 'folder-processing',
								folderId: data.folderId,
								folderPath: data.folderPath,
								isFolderMain: true, // Marcar como sticky
							});
							break; // Salir temprano para no duplicar
						}
						icon = '└──';
					} else if (phase === 'metadata') icon = '📊';
					else if (phase === 'complete') {
						icon = '✅';
						level = 'SUCCESS';
					} else if (phase === 'error') {
						icon = '❌';
						level = 'ERROR';
					}

					// Log genérico de fase (solo si no fue manejado arriba)
					addLog(level, `${icon} ${progressMsg}`, {
						source: 'folder-progress',
						folderId: data.folderId,
						folderPath: data.folderPath,
					});

					// Actualizar progreso general
					if (progress > 0) {
						setCurrentProgress(progress);
					}
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

	// Configurar conexión SSE cuando está activo - con reconexión automática
	useEffect(() => {
		if (!isActive) return;

		// Función para calcular delay con exponential backoff
		const getReconnectDelay = (attempt: number) => {
			const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** attempt, MAX_RECONNECT_DELAY);
			// Añadir jitter para evitar thundering herd
			return delay + Math.random() * 1000;
		};

		// Función para conectar SSE con manejo de reconexión
		const connectSSE = () => {
			// Evitar conexiones duplicadas
			if (isConnectingRef.current || sseRef.current?.readyState === EventSource.OPEN) {
				return;
			}

			isConnectingRef.current = true;

			if (reconnectAttemptRef.current === 0) {
				addLog('INFO', '🔌 Conectando al servidor de eventos...', { source: 'terminal' });
			} else {
				addLog('INFO', `🔄 Reconectando... (intento ${reconnectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS})`, {
					source: 'sse',
				});
			}

			// Cerrar conexión existente si hay
			if (sseRef.current) {
				sseRef.current.close();
				sseRef.current = null;
			}

			const eventSource = new EventSource('/api/events/stream');
			sseRef.current = eventSource;

			eventSource.onopen = () => {
				isConnectingRef.current = false;
				reconnectAttemptRef.current = 0; // Reset intentos en conexión exitosa
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
					clientLogger.error('Error parsing SSE event:', error);
					addLog('ERROR', '❌ Error procesando evento del servidor', { source: 'sse' });
				}
			});

			eventSource.addEventListener('heartbeat', () => {
				// Heartbeat silencioso - confirma que conexión está viva
			});

			eventSource.onerror = (error) => {
				isConnectingRef.current = false;
				clientLogger.error('SSE Error:', error);

				// Solo intentar reconectar si está activo y no hemos agotado intentos
				if (isActive && reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
					const delay = getReconnectDelay(reconnectAttemptRef.current);
					addLog('WARNING', `⚠️ Conexión perdida. Reconectando en ${Math.round(delay / 1000)}s...`, { source: 'sse' });

					// Limpiar timeout anterior si existe
					if (reconnectTimeoutRef.current) {
						clearTimeout(reconnectTimeoutRef.current);
					}

					reconnectAttemptRef.current++;
					reconnectTimeoutRef.current = setTimeout(() => {
						connectSSE();
					}, delay);
				} else if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
					addLog('ERROR', '❌ No se pudo restablecer la conexión. Los logs pueden estar desactualizados.', {
						source: 'sse',
					});
				}
			};
		};

		// Iniciar conexión
		connectSSE();

		return () => {
			// Limpiar todo al desmontar
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}
			if (sseRef.current) {
				sseRef.current.close();
				sseRef.current = null;
			}
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
			reconnectAttemptRef.current = 0;
			isConnectingRef.current = false;
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

		// Detectar si es un sub-log (archivo individual)
		const isSubLog = log.message.includes('└──');
		// Detectar si es una carpeta sticky
		const isFolderLog = log.isSticky || log.isFolderMain;

		return (
			<div
				className={cn(
					'flex min-h-[32px] items-center gap-3 px-3 py-2',
					// Estilo para carpetas sticky
					log.isSticky && {
						'sticky top-0 z-10 border-blue-500/30 border-b py-3 shadow-lg backdrop-blur-sm': true,
						'bg-gradient-to-r from-blue-900/40 via-blue-800/20 to-transparent': true,
						'ring-1 ring-blue-400/30': true,
					},
					// Estilo para carpetas normales (no sticky pero importante)
					isFolderLog && !log.isSticky && 'bg-gray-900/30 font-semibold',
					// Estilo para sub-logs (archivos)
					isSubLog && 'pl-12 text-gray-400 hover:bg-gray-900/20'
				)}
				data-sticky={log.isSticky}
				key={log.id}
			>
				<span
					className={cn('font-mono tabular-nums', log.isSticky ? 'text-blue-300 text-xs' : 'text-[10px] text-gray-600')}
				>
					{formatTimestamp(log.timestamp)}
				</span>
				<Icon className={cn('shrink-0', log.isSticky ? 'h-4 w-4' : 'h-3 w-3', colorClass)} />
				<span
					className={cn(
						'flex-1 overflow-hidden break-words font-mono leading-relaxed',
						// Tamaño y peso según tipo
						log.isSticky && 'font-bold text-base text-white',
						isFolderLog && !log.isSticky && 'font-semibold text-gray-100 text-sm',
						isSubLog && 'text-gray-400 text-xs',
						!(isFolderLog || isSubLog) && 'text-gray-200 text-sm'
					)}
				>
					{log.message}
				</span>
			</div>
		);
	};

	return (
		<div className={cn('flex h-full w-full flex-col', className)}>
			{/* Barra de progreso */}
			{showProgress && (
				<div className="border-gray-800 border-b bg-gray-950 px-4 py-3">
					<div className="mb-2 flex items-center justify-between text-xs">
						<span className="font-mono text-gray-400">{currentProgress < 100 ? 'Procesando...' : 'Completado'}</span>
						<span className="font-bold font-mono text-blue-400">{currentProgress.toFixed(1)}%</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
						<div
							className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 transition-all duration-300 ease-out"
							style={{ width: `${currentProgress}%` }}
						/>
					</div>
					{startTime && currentProgress < 100 && (
						<div className="mt-2 font-mono text-[10px] text-gray-500">
							Tiempo transcurrido: {formatElapsedTime(elapsedTime)}
						</div>
					)}
				</div>
			)}

			{/* Terminal con soporte para sticky logs */}
			<div className="relative flex-1 overflow-y-auto rounded-sm bg-black">
				{logs.length === 0 ? (
					<div className="flex items-center justify-center p-8 text-gray-500">
						<Terminal className="mr-3 h-5 w-5" />
						<span className="font-mono text-sm">Esperando logs...</span>
					</div>
				) : (
					<div className="w-full space-y-0.5 p-2" ref={logContainerRef}>
						{logs.map((log, index) => renderLogEntry(log, index))}
					</div>
				)}
			</div>
		</div>
	);
}
