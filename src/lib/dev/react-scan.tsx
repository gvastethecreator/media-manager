import React from 'react';
import { useEffect } from 'react';

let reactScanInitialized = false;

export function ReactScanProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (!import.meta.env.DEV || reactScanInitialized) {
			return;
		}

		reactScanInitialized = true;

		void import('react-scan')
			.then(({ scan }) => {
				if (typeof scan === 'function') {
					scan();
				}
			})
			.catch((error) => {
				console.warn('No se pudo inicializar React Scan:', error);
			});
	}, []);

	return <>{children}</>;
}
