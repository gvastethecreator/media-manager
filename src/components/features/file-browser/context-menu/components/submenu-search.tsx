import { Search, X } from 'lucide-react';
import { memo, useCallback } from 'react';
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
export const SubmenuSearch = memo<SubmenuSearchProps>(function SubmenuSearch({
	searchTerm,
	onSearchChange,
	placeholder = 'Buscar...',
	className,
}) {
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
			<Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

			<Input value={searchTerm} onChange={handleChange} placeholder={placeholder} className="h-8 pl-8 pr-8 text-sm" />

			{searchTerm && (
				<button
					type="button"
					onClick={handleClear}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Limpiar búsqueda</span>
				</button>
			)}
		</div>
	);
});
