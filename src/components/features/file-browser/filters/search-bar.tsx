'use client';

import { Search, X } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

export interface SearchBarProps {
	placeholder?: string;
	className?: string;
	debounceMs?: number;
	showClearButton?: boolean;
}

/**
 * Barra de búsqueda para el FileBrowser
 * Se integra con el store de ViewOptions para aplicar búsquedas
 */
export const SearchBar = memo<SearchBarProps>(function SearchBar({
	placeholder = 'Buscar archivos...',
	className,
	debounceMs = 300,
	showClearButton = true,
}) {
	// Estado local para el input
	const [inputValue, setInputValue] = useState('');

	// Acceder al store de opciones de vista
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);
	const setSearchQuery = useViewOptionsStore((state) => state.setSearchQuery);

	// Sincronizar el estado local con el store cuando cambia desde fuera
	useEffect(() => {
		if (searchQuery !== inputValue) {
			setInputValue(searchQuery);
		}
	}, [searchQuery, inputValue]);

	// Aplicar debounce a la búsqueda
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchQuery(inputValue);
		}, debounceMs);

		return () => clearTimeout(timer);
	}, [inputValue, debounceMs, setSearchQuery]);

	// Manejar cambios en el input
	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	}, []);

	// Limpiar la búsqueda
	const handleClear = useCallback(() => {
		setInputValue('');
		setSearchQuery('');
	}, [setSearchQuery]);

	return (
		<div className={cn('relative flex items-center', className)}>
			<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

			<Input
				type="text"
				placeholder={placeholder}
				value={inputValue}
				onChange={handleChange}
				className="pl-8 pr-8 h-9"
			/>

			{showClearButton && inputValue && (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-accent"
					onClick={handleClear}
				>
					<X className="h-3.5 w-3.5" />
				</Button>
			)}
		</div>
	);
});
