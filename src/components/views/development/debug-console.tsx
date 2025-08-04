import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogViewer, useLogViewer } from '@/components/ui/log-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConsoleCapture } from '@/lib/hooks/system/use-console-capture';
import { clientLogger } from '@/lib/logger/client-logger';

// Crear un logger específico para este componente
const debugLogger = clientLogger.withContext('DebugConsole');

export function DebugConsole() {
	const [activeTab, setActiveTab] = useState('console');
	const { logs, addLog, clearLogs, debug, info, warn, error, success } = useLogViewer();

	// Crear un wrapper para adaptar la signatura de addLog a LogEntry
	const handleCaptureLog = (logEntry: any) => {
		addLog(logEntry.level, logEntry.message, logEntry.context, logEntry.data);
	};

	const { startCapture, stopCapture, isCapturing } = useConsoleCapture(handleCaptureLog);

	// Iniciar captura al montar el componente
	useEffect(() => {
		startCapture();
		return () => stopCapture();
	}, [startCapture, stopCapture]);

	// Generar logs de ejemplo
	const generateExampleLogs = () => {
		// Logs normales de consola
		console.log('Este es un log normal de consola');
		console.info('Este es un mensaje informativo');
		console.warn('Este es un mensaje de advertencia');
		console.error('Este es un mensaje de error');
		console.debug('Este es un mensaje de depuración');

		// Logs con datos adicionales
		console.log('Log con datos', { userId: 1, name: 'Usuario de prueba' });
		console.error('Error con detalles', new Error('Error de ejemplo'));

		// Logs con el logger mejorado
		debugLogger.info('Mensaje usando el logger mejorado');
		debugLogger.success('Operación completada con éxito');
		debugLogger.warn('Advertencia desde el logger mejorado', { code: 'WARN_001' });
		debugLogger.error('Error desde el logger mejorado', {
			code: 'ERR_001',
			details: 'Detalles adicionales del error',
		});

		// Logs directos al visor
		debug('Log de depuración directo al visor', 'DirectAPI');
		info('Log informativo directo al visor', 'DirectAPI');
		warn('Advertencia directa al visor', 'DirectAPI');
		error('Error directo al visor', 'DirectAPI');
		success('Éxito directo al visor', 'DirectAPI');
	};

	// Ejemplo de grupo de logs
	const generateGroupedLogs = () => {
		console.group('Grupo de logs de ejemplo');
		console.log('Log dentro de un grupo');
		console.info('Info dentro de un grupo');

		console.group('Subgrupo anidado');
		console.warn('Advertencia en subgrupo');
		console.error('Error en subgrupo');
		console.groupEnd();

		console.log('Volviendo al grupo principal');
		console.groupEnd();
	};

	// Ejemplo de medición de tiempo
	const measurePerformance = () => {
		console.time('operacionPesada');

		// Simulamos una operación que toma tiempo
		const start = Date.now();
		while (Date.now() - start < 1000) {
			// Esperar 1 segundo
		}

		console.timeEnd('operacionPesada');
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Consola de Depuración</CardTitle>
					<CardDescription>Herramienta para visualizar y capturar logs de la aplicación</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2 mb-4">
						<Button type="button" onClick={generateExampleLogs} variant="primary">
							Generar logs de ejemplo
						</Button>
						<Button type="button" onClick={generateGroupedLogs} variant="outline">
							Generar logs agrupados
						</Button>
						<Button type="button" onClick={measurePerformance} variant="outline">
							Medir rendimiento
						</Button>
						<Button type="button" onClick={clearLogs} variant="destructive">
							Limpiar logs
						</Button>
						<Button
							type="button"
							onClick={isCapturing ? stopCapture : startCapture}
							variant={isCapturing ? 'primary' : 'outline'}
						>
							{isCapturing ? 'Detener captura' : 'Iniciar captura'}
						</Button>
					</div>

					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="console">Consola</TabsTrigger>
							<TabsTrigger value="help">Ayuda</TabsTrigger>
						</TabsList>
						<TabsContent value="console" className="mt-4">
							<LogViewer logs={logs} onClear={clearLogs} maxHeight="500px" title="Logs Capturados" />
						</TabsContent>
						<TabsContent value="help" className="mt-4">
							<Card>
								<CardHeader>
									<CardTitle>Guía de Uso</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<h3 className="text-lg font-medium">Captura de Logs</h3>
										<p className="text-sm text-muted-foreground">
											Esta herramienta captura automáticamente todos los logs de consola y los muestra en la interfaz.
											Puedes detener la captura en cualquier momento con el botón &quot;Detener Captura&quot;.
										</p>
									</div>

									<div>
										<h3 className="text-lg font-medium">Logger Mejorado</h3>
										<p className="text-sm text-muted-foreground">
											Puedes usar el logger mejorado en tu código importando:
										</p>
										<pre className="bg-muted p-2 rounded-md text-xs mt-2">
											{`import { clientLogger } from '@/lib/logger/client-logger';

// Crear un logger específico para tu componente
const myLogger = clientLogger.withContext('MiComponente');

// Usar el logger
myLogger.info('Mensaje informativo');
myLogger.success('Operación exitosa');
myLogger.warn('Advertencia');
myLogger.error('Error', { detalles: 'Información adicional' });`}
										</pre>
									</div>

									<div>
										<h3 className="text-lg font-medium">Visor de Logs</h3>
										<p className="text-sm text-muted-foreground">
											Puedes integrar el visor de logs en cualquier componente:
										</p>
										<pre className="bg-muted p-2 rounded-md text-xs mt-2">
											{`import { LogViewer, useLogViewer } from '@/components/ui/log-viewer';

// En tu componente
const { logs, addLog, clearLogs } = useLogViewer();

// Añadir logs manualmente
addLog('info', 'Mi mensaje', 'Contexto', { datos: 'adicionales' });

// Renderizar el visor
<LogViewer logs={logs} onClear={clearLogs} />`}
										</pre>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
