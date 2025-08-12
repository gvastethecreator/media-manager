import { Search, X } from 'lucide-react';
import React, { memo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SubmenuSearchProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

/**
 * Componente de búsqueda para submenús con botón de limpiar
 */
const SubmenuSearchImpl = memo<SubmenuSearchProps>(
	({ searchTerm, onSearchChange, placeholder = 'Buscar...', className }) => {
		// Manejador de cambio de texto
		const handleChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				onSearchChange(e.target.value);
			},
			[onSearchChange]
		);

		// Manejador para limpiar la búsqueda
		const handleClear = useCallback(() => {
			onSearchChange('');
		}, [onSearchChange]);

		return (
			<div className={cn('relative', className)}>
				<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-muted-foreground" />

				<Input className="h-8 pr-8 pl-8 text-sm" onChange={handleChange} placeholder={placeholder} value={searchTerm} />

				{searchTerm && (
					<button
						className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground hover:text-foreground"
						onClick={handleClear}
						type="button"
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Limpiar búsqueda</span>
					</button>
				)}
			</div>
		);
	}
);

export const SubmenuSearch = SubmenuSearchImpl;
