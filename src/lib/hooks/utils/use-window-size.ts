import { useEffect, useState } from 'react';

interface WindowSize {
	height: number;
	width: number;
}

export function useWindowSize(): WindowSize {
	const [windowSize, setWindowSize] = useState<WindowSize>({
		width: typeof window !== 'undefined' ? window.innerWidth : 0,
		height: typeof window !== 'undefined' ? window.innerHeight : 0,
	});

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		// Throttle resize events
		let timeoutId: NodeJS.Timeout;
		const throttledHandleResize = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			timeoutId = setTimeout(handleResize, 100);
		};

		window.addEventListener('resize', throttledHandleResize);
		handleResize();

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			window.removeEventListener('resize', throttledHandleResize);
		};
	}, []);

	return windowSize;
}
