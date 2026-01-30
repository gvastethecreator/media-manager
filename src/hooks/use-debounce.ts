import { useEffect, useState } from 'react';

export function useDebounce(value: string, delay?: number): string {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
}
