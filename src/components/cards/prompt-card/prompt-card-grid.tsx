import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { debounce } from '@/lib/utils';
import { MemoizedPromptCard } from './prompt-card';
import type { PromptCardData } from './prompt-server-actions';
import { searchPrompts } from './prompt-server-actions';

interface PromptCardGridProps {
	/** Título del grid */
	title?: string;
	/** Mostrar barra de búsqueda */
	showSearch?: boolean;
	/** Si está cargando */
	isLoading?: boolean;
	/** Datos iniciales */
	initialPrompts?: PromptCardData[];
	/** Función a ejecutar al hacer click en un prompt */
	onPromptClick?: (prompt: PromptCardData) => void;
	/** Si las tarjetas están en modo TCG */
	tcgMode?: boolean;
	/** Si las tarjetas están en modo compacto */
	compact?: boolean;
	/** Si alguna tarjeta está seleccionada */
	selectedPromptId?: string | null;
	/** Placeholder de la búsqueda */
	searchPlaceholder?: string;
	/** Máximo de tarjetas a mostrar */
	maxPrompts?: number;
}

/**
 * Grid para mostrar múltiples tarjetas de prompts con búsqueda y paginación.
 * Incluye efectos de masonry responsivo y selección.
 */
export function PromptCardGrid({
	title = 'Prompts',
	showSearch = true,
	isLoading = false,
	initialPrompts = [],
	onPromptClick,
	tcgMode = true,
	compact = false,
	selectedPromptId = null,
	searchPlaceholder = 'Buscar prompts...',
	maxPrompts = 50,
}: PromptCardGridProps) {
	const [prompts, setPrompts] = useState<PromptCardData[]>(initialPrompts);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(isLoading || initialPrompts.length === 0);

	const containerRef = useRef<HTMLDivElement>(null);

	// Función debounceada para buscar prompts
	const debouncedSearch = useRef(
		debounce(async (query: string) => {
			try {
				setLoading(true);
				const results = await searchPrompts(query, maxPrompts);
				setPrompts(results);
			} catch (error) {
				console.error('Error al buscar prompts:', error);
			} finally {
				setLoading(false);
			}
		}, 300)
	).current;

	// Cargar prompts iniciales si no se proporcionaron
	useEffect(() => {
		if (initialPrompts.length === 0 && !isLoading) {
			debouncedSearch('');
		} else {
			setLoading(isLoading);
			setPrompts(initialPrompts);
		}
	}, [initialPrompts, isLoading, debouncedSearch]);

	// Manejar cambios en el término de búsqueda
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		debouncedSearch(value);
	};

	// Renderizar esqueletos de carga
	const renderSkeletons = () => {
		return Array.from({ length: 6 }).map((_, _index) => (
			<div
				key={`prompt-skeleton-${Math.random().toString(36).substring(2)}`}
				className="w-[300px] md:w-[320px] h-[400px]"
			>
				<Skeleton className="h-full w-full rounded-xl" />
			</div>
		));
	};

	return (
		<div className="w-full space-y-4">
			{/* Cabecera con título y búsqueda */}
			<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<h2 className="text-2xl font-bold">{title}</h2>

				{showSearch && (
					<div className="relative w-full md:w-[320px]">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							type="search"
							placeholder={searchPlaceholder}
							className="pl-10 w-full"
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</div>
				)}
			</header>

			{/* Grid de tarjetas */}
			<div
				ref={containerRef}
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center"
			>
				{loading ? (
					renderSkeletons()
				) : prompts.length === 0 ? (
					<div className="col-span-full py-12 text-center">
						<p className="text-muted-foreground">No se encontraron prompts</p>
					</div>
				) : (
					prompts.map((prompt) => (
						<MemoizedPromptCard
							key={prompt.id}
							prompt={prompt}
							tcgMode={tcgMode}
							compact={compact}
							onClick={onPromptClick ? () => onPromptClick(prompt) : undefined}
							isSelected={selectedPromptId === prompt.id}
						/>
					))
				)}
			</div>
		</div>
	);
}
