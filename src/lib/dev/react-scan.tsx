// React Scan integration
'use client';

import { useEffect } from 'react';

export function ReactScanProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		// Only run in development environment
		if (process.env.NODE_ENV === 'development') {
			// Dynamically import react-scan
			import('react-scan')
				.then((reactScan) => {
					// Initialize react-scan
					// Using the most basic initialization to avoid TypeScript errors
					if (typeof reactScan.scan === 'function') {
						reactScan.scan();
					}
				})
				.catch((error) => {
					console.error('Failed to initialize React Scan:', error);
				});
		}
	}, []);

	return <>{children}</>;
}
