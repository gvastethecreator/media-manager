import { Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getPrompts } from '@/lib/api/client/prompt.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { debounceEvent } from '@/lib/system/event-throttler';
import type { PromptWithStats } from '@/types/entities/prompt';
import { PromptCard } from './prompt-card';

interface PromptCardGridProps {
	/** Título del grid */
	title?: string;
	/** Mostrar barra de búsqueda */
	showSearch?: boolean;
	/** Si está cargando */
	isLoading?: boolean;
	/** Datos iniciales */
	initialPrompts?: PromptWithStats[];
	/** Función a ejecutar al hacer click en un prompt */
	onPromptClick?: (prompt: PromptWithStats) => void;
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
	const [prompts, setPrompts] = useState<PromptWithStats[]>(initialPrompts);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(isLoading || initialPrompts.length === 0);

	const containerRef = useRef<HTMLDivElement>(null);

	// Función debounceada para buscar prompts
	const debouncedSearch = useRef(
		debounceEvent(async (query: string) => {
			try {
				setLoading(true);
				const results = await getPrompts({ search: query, limit: maxPrompts });
				setPrompts(results);
			} catch (error) {
				clientLogger.error('Error al buscar prompts:', error);
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
				className="h-[400px] w-[300px] md:w-[320px]"
				key={`prompt-skeleton-${Math.random().toString(36).substring(2)}`}
			>
				<Skeleton className="h-full w-full rounded-xl" />
			</div>
		));
	};

	return (
		<div className="w-full space-y-4">
			{/* Cabecera con título y búsqueda */}
			<header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<h2 className="font-bold text-2xl">{title}</h2>

				{showSearch && (
					<div className="relative w-full md:w-[320px]">
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
						<Input
							className="w-full pl-10"
							onChange={handleSearchChange}
							placeholder={searchPlaceholder}
							type="search"
							value={searchTerm}
						/>
					</div>
				)}
			</header>

			{/* Grid de tarjetas */}
			<div
				className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				ref={containerRef}
			>
				{(() => {
					if (loading) {
						return renderSkeletons();
					}

					if (prompts.length === 0) {
						return (
							<div className="col-span-full py-12 text-center">
								<p className="text-muted-foreground">No se encontraron prompts</p>
							</div>
						);
					}

					return prompts.map((prompt) => (
						<PromptCard
							compact={compact}
							isSelected={selectedPromptId === prompt.id}
							key={prompt.id}
							onClick={onPromptClick ? () => onPromptClick(prompt) : undefined}
							prompt={prompt}
							tcgMode={tcgMode}
						/>
					));
				})()}
			</div>
		</div>
	);
}
