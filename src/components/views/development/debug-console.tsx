import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogViewer, useLogViewer } from '@/components/ui/log-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConsoleCapture } from '@/lib/hooks/system/use-console-capture';
import { clientLogger } from '@/lib/logger/client-logger';

// Create a logger for this component
const debugLogger = clientLogger.withContext('DebugConsole');

export function DebugConsole() {
	const [activeTab, setActiveTab] = useState('console');
	const { logs, addLog, clearLogs, debug, info, warn, error, success } = useLogViewer();

	// Adapt addLog to the LogEntry signature
	const handleCaptureLog = (logEntry: any) => {
		addLog(logEntry.level, logEntry.message, logEntry.context, logEntry.data);
	};

	const { startCapture, stopCapture, isCapturing } = useConsoleCapture(handleCaptureLog);

	// Start capturing when the component mounts
	useEffect(() => {
		startCapture();
		return () => stopCapture();
	}, [startCapture, stopCapture]);

	// Generate example logs
	const generateExampleLogs = () => {
		// Standard console logs
		console.log('This is a standard console log');
		console.info('This is an informational message');
		console.warn('This is a warning message');
		console.error('This is an error message');
		console.debug('This is a debug message');

		// Logs with extra data
		console.log('Log with data', { userId: 1, name: 'Test user' });
		console.error('Error with details', new Error('Example error'));

		// Logs with the enhanced logger
		debugLogger.info('Message from the enhanced logger');
		debugLogger.success('Operation completed successfully');
		debugLogger.warn('Warning from the enhanced logger', { code: 'WARN_001' });
		debugLogger.error('Error from the enhanced logger', {
			code: 'ERR_001',
			details: 'Additional error details',
		});

		// Logs sent directly to the viewer
		debug('Debug log sent directly to the viewer', 'DirectAPI');
		info('Info log sent directly to the viewer', 'DirectAPI');
		warn('Warning sent directly to the viewer', 'DirectAPI');
		error('Error sent directly to the viewer', 'DirectAPI');
		success('Success sent directly to the viewer', 'DirectAPI');
	};

	// Generate grouped logs
	const generateGroupedLogs = () => {
		console.group('Example log group');
		console.log('Log inside a group');
		console.info('Info inside a group');

		console.group('Nested subgroup');
		console.warn('Warning in subgroup');
		console.error('Error in subgroup');
		console.groupEnd();

		console.log('Returning to the main group');
		console.groupEnd();
	};

	// Measure an example operation
	const measurePerformance = () => {
		console.time('heavyOperation');

		// Simulate a time-consuming operation
		const start = Date.now();
		while (Date.now() - start < 1000) {
			// Wait one second
		}

		console.timeEnd('heavyOperation');
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Debug Console</CardTitle>
					<CardDescription>Inspect and capture application logs</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-wrap gap-2">
						<Button onClick={generateExampleLogs} type="button" variant="primary">
							Generate example logs
						</Button>
						<Button onClick={generateGroupedLogs} type="button" variant="outline">
							Generate grouped logs
						</Button>
						<Button onClick={measurePerformance} type="button" variant="outline">
							Measure performance
						</Button>
						<Button onClick={clearLogs} type="button" variant="destructive">
							Clear logs
						</Button>
						<Button
							onClick={isCapturing ? stopCapture : startCapture}
							type="button"
							variant={isCapturing ? 'primary' : 'outline'}
						>
							{isCapturing ? 'Stop capture' : 'Start capture'}
						</Button>
					</div>

					<Tabs onValueChange={setActiveTab} value={activeTab}>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="console">Console</TabsTrigger>
							<TabsTrigger value="help">Help</TabsTrigger>
						</TabsList>
						<TabsContent className="mt-4" value="console">
							<LogViewer logs={logs} maxHeight="500px" onClear={clearLogs} title="Captured Logs" />
						</TabsContent>
						<TabsContent className="mt-4" value="help">
							<Card>
								<CardHeader>
									<CardTitle>Usage Guide</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<h3 className="font-medium text-lg">Log Capture</h3>
										<p className="text-muted-foreground text-sm">
											This tool captures console logs automatically and displays them here. Stop capture at any time with
											the &quot;Stop capture&quot; button.
										</p>
									</div>

									<div>
										<h3 className="font-medium text-lg">Enhanced Logger</h3>
										<p className="text-muted-foreground text-sm">
											Import the enhanced logger in your code:
										</p>
										<pre className="mt-2 rounded-md bg-muted p-2 text-xs">
											{`import { clientLogger } from '@/lib/logger/client-logger';

// Create a logger for your component
const myLogger = clientLogger.withContext('MyComponent');

// Use the logger
myLogger.info('Informational message');
myLogger.success('Operation succeeded');
myLogger.warn('Warning');
myLogger.error('Error', { details: 'Additional information' });`}
										</pre>
									</div>

									<div>
										<h3 className="font-medium text-lg">Log Viewer</h3>
										<p className="text-muted-foreground text-sm">
											Add the log viewer to any component:
										</p>
										<pre className="mt-2 rounded-md bg-muted p-2 text-xs">
											{`import { LogViewer, useLogViewer } from '@/components/ui/log-viewer';

// In your component
const { logs, addLog, clearLogs } = useLogViewer();

// Add logs manually
addLog('info', 'My message', 'Context', { data: 'additional' });

// Render the viewer
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
