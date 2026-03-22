'use client';

import { useCallback, useEffect, useState } from 'react';

interface ConsoleMessage {
	args: any[];
	message: string;
	timestamp: number;
	type: 'log' | 'warn' | 'error' | 'info';
}

export function useConsoleCapture() {
	const [messages, setMessages] = useState<ConsoleMessage[]>([]);
	const [isCapturing, setIsCapturing] = useState(false);

	const originalConsole = {
		log: console.log,
		warn: console.warn,
		error: console.error,
		info: console.info,
	};

	const captureMessage = useCallback((type: ConsoleMessage['type'], args: any[]) => {
		const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ');

		setMessages((prev) => [
			...prev,
			{
				type,
				message,
				timestamp: Date.now(),
				args,
			},
		]);
	}, []);

	const startCapturing = useCallback(() => {
		if (isCapturing) {
			return;
		}

		console.log = (...args: any[]) => {
			originalConsole.log(...args);
			captureMessage('log', args);
		};

		console.warn = (...args: any[]) => {
			originalConsole.warn(...args);
			captureMessage('warn', args);
		};

		console.error = (...args: any[]) => {
			originalConsole.error(...args);
			captureMessage('error', args);
		};

		console.info = (...args: any[]) => {
			originalConsole.info(...args);
			captureMessage('info', args);
		};

		setIsCapturing(true);
	}, [
		isCapturing,
		captureMessage,
		originalConsole.error,
		originalConsole.info,
		originalConsole.log,
		originalConsole.warn,
	]);

	const stopCapturing = useCallback(() => {
		if (!isCapturing) {
			return;
		}

		console.log = originalConsole.log;
		console.warn = originalConsole.warn;
		console.error = originalConsole.error;
		console.info = originalConsole.info;

		setIsCapturing(false);
	}, [isCapturing, originalConsole.error, originalConsole.info, originalConsole.log, originalConsole.warn]);

	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	useEffect(() => {
		return () => {
			stopCapturing();
		};
	}, [stopCapturing]);

	return {
		messages,
		isCapturing,
		startCapturing,
		stopCapturing,
		clearMessages,
	};
}
