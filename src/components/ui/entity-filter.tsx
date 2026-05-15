import { CalendarIcon, Filter, RotateCcw, Save, SearchIcon, SlidersHorizontal, Trash } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Calendar } from './calendar';

// Tipos de filtros soportados
export type FilterType =
	| 'text'
	| 'select'
	| 'multiselect'
	| 'checkbox'
	| 'radio'
	| 'date'
	| 'dateRange'
	| 'number'
	| 'numberRange'
	| 'boolean';

// Definición de un filtro
export interface EntityFilterDefinition {
	/**
	 * Si el filtro está desplegado por defecto
	 */
	defaultExpanded?: boolean;

	/**
	 * Valor por defecto
	 */
	defaultValue?: any;

	/**
	 * Icono para el filtro
	 */
	icon?: React.ReactNode;
	/**
	 * ID único del filtro
	 */
	id: string;

	/**
	 * Etiqueta para mostrar
	 */
	label: string;
	max?: number;

	/**
	 * Valores mínimo y máximo para filtros numéricos
	 */
	min?: number;

	/**
	 * Opciones para select, multiselect, radio, checkbox
	 */
	options?: Array<{
		label: string;
		value: string | number | boolean;
	}>;

	/**
	 * Placeholder para inputs
	 */
	placeholder?: string;

	/**
	 * Tipo de filtro
	 */
	type: FilterType;

	/**
	 * Función para validar el valor
	 */
	validate?: (value: any) => boolean;
}

// Filtro guardado
export interface SavedFilter {
	/**
	 * Nombre del filtro guardado
	 */
	name: string;

	/**
	 * Valores aplicados
	 */
	values: Record<string, any>;
}

// Props del componente EntityFilter
export interface EntityFilterProps {
	/**
	 * Si permite guardar filtros favoritos
	 */
	allowSavedFilters?: boolean;

	/**
	 * Clases adicionales
	 */
	className?: string;

	/**
	 * Texto del botón de limpiar filtros
	 */
	clearButtonText?: string;

	/**
	 * Si debe ser compacto (menos espaciado)
	 */
	compact?: boolean;
	/**
	 * Definiciones de filtros disponibles
	 */
	filters: EntityFilterDefinition[];

	/**
	 * Valores iniciales de los filtros
	 */
	initialValues?: Record<string, any>;

	/**
	 * Función llamada cuando cambian los filtros
	 */
	onChange: (values: Record<string, any>) => void;

	/**
	 * Función llamada cuando se elimina un filtro
	 */
	onDeleteSavedFilter?: (name: string) => void;

	/**
	 * Función llamada cuando se guarda un filtro
	 */
	onSaveFilter?: (filter: SavedFilter) => void;

	/**
	 * Filtros guardados iniciales
	 */
	savedFilters?: SavedFilter[];

	/**
	 * Placeholder para búsqueda rápida
	 */
	searchPlaceholder?: string;

	/**
	 * Si mostrar contador de filtros activos
	 */
	showActiveCount?: boolean;

	/**
	 * Si mostrar barra de búsqueda rápida
	 */
	showQuickSearch?: boolean;
}

/**
 * Componente avanzado para filtros complejos de entidades.
 * Soporta múltiples tipos de filtros, guardado y reutilización.
 */
export function EntityFilter({
	filters,
	initialValues = {},
	onChange,
	showQuickSearch = true,
	searchPlaceholder = 'Buscar...',
	allowSavedFilters = false,
	savedFilters = [],
	onSaveFilter,
	onDeleteSavedFilter,
	showActiveCount = true,
	className,
	clearButtonText = 'Limpiar filtros',
	compact = false,
}: EntityFilterProps) {
	// Estado de los valores de filtro
	const [filterValues, setFilterValues] = useState<Record<string, any>>(initialValues);
	const [quickSearch, setQuickSearch] = useState('');
	const [filterName, setFilterName] = useState('');
	const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

	// Contar filtros activos (excluyendo la búsqueda rápida)
	const activeFiltersCount = Object.entries(filterValues).filter(([key, value]) => {
		if (key === 'quickSearch') {
			return false;
		}
		if (value === undefined || value === null) {
			return false;
		}
		if (Array.isArray(value) && value.length === 0) {
			return false;
		}
		if (value === '') {
			return false;
		}
		return true;
	}).length;

	// Actualizar valores de filtro
	const updateFilterValue = useCallback((id: string, value: any) => {
		setFilterValues((prev) => {
			const newValues = { ...prev, [id]: value };

			// Si el valor es nulo, indefinido o cadena vacía, eliminarlo
			if (value === undefined || value === null || value === '') {
				delete newValues[id];
			}

			return newValues;
		});
	}, []);

	// Busqueda rápida
	useEffect(() => {
		if (showQuickSearch) {
			updateFilterValue('quickSearch', quickSearch);
		}
	}, [quickSearch, showQuickSearch, updateFilterValue]);

	// Notificar cambios en filtros
	useEffect(() => {
		onChange(filterValues);
	}, [filterValues, onChange]);

	// Aplicar un filtro guardado
	const applyFilter = (filter: SavedFilter) => {
		setFilterValues(filter.values);
		// Si hay búsqueda rápida y está en el filtro guardado, actualizarla
		if (filter.values.quickSearch) {
			setQuickSearch(filter.values.quickSearch);
		}
		setIsFilterPanelOpen(false);
	};

	// Guardar filtro actual
	const saveCurrentFilter = () => {
		if (!(filterName.trim() && onSaveFilter)) {
			return;
		}

		const newFilter: SavedFilter = {
			name: filterName.trim(),
			values: { ...filterValues },
		};

		onSaveFilter(newFilter);
		setFilterName('');
	};

	// Limpiar todos los filtros
	const clearAllFilters = () => {
		setFilterValues({});
		setQuickSearch('');
	};

	// Renderizar un filtro según su tipo
	const renderFilter = (filter: EntityFilterDefinition) => {
		switch (filter.type) {
			case 'text':
				return (
					<div className="space-y-2" key={filter.id}>
						<Label htmlFor={filter.id}>{filter.label}</Label>
						<Input
							id={filter.id}
							onChange={(e) => updateFilterValue(filter.id, e.target.value)}
							placeholder={filter.placeholder}
							value={filterValues[filter.id] || ''}
						/>
					</div>
				);

			case 'select':
				return (
					<div className="space-y-2" key={filter.id}>
						<Label htmlFor={filter.id}>{filter.label}</Label>
						<Select
							onValueChange={(value) => updateFilterValue(filter.id, value)}
							value={filterValues[filter.id] || ''}
						>
							<SelectTrigger id={filter.id}>
								<SelectValue placeholder={filter.placeholder || `Seleccionar ${filter.label.toLowerCase()}`} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								{filter.options?.map((option) => (
									<SelectItem key={String(option.value)} value={String(option.value)}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				);

			case 'checkbox':
				return (
					<div className="space-y-2" key={filter.id}>
						<Label>{filter.label}</Label>
						<div className="space-y-2">
							{filter.options?.map((option) => (
								<div className="flex items-center space-x-2" key={String(option.value)}>
									<Checkbox
										checked={Array.isArray(filterValues[filter.id]) && filterValues[filter.id]?.includes(option.value)}
										id={`${filter.id}-${option.value}`}
										onCheckedChange={(checked) => {
											const values = Array.isArray(filterValues[filter.id]) ? [...filterValues[filter.id]] : [];
											if (checked) {
												updateFilterValue(filter.id, [...values, option.value]);
											} else {
												updateFilterValue(
													filter.id,
													values.filter((v) => v !== option.value)
												);
											}
										}}
									/>
									<Label className="cursor-pointer" htmlFor={`${filter.id}-${option.value}`}>
										{option.label}
									</Label>
								</div>
							))}
						</div>
					</div>
				);

			case 'radio':
				return (
					<div className="space-y-2" key={filter.id}>
						<Label>{filter.label}</Label>
						<RadioGroup
							onValueChange={(value) => updateFilterValue(filter.id, value)}
							value={filterValues[filter.id] || ''}
						>
							<div className="space-y-2">
								{filter.options?.map((option) => (
									<div className="flex items-center space-x-2" key={String(option.value)}>
										<RadioGroupItem id={`${filter.id}-${option.value}`} value={String(option.value)} />
										<Label className="cursor-pointer" htmlFor={`${filter.id}-${option.value}`}>
											{option.label}
										</Label>
									</div>
								))}
							</div>
						</RadioGroup>
					</div>
				);

			case 'date':
				return (
					<div className="space-y-2" key={filter.id}>
						<Label htmlFor={filter.id}>{filter.label}</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									className={cn(
										'w-full justify-start text-left font-normal',
										!filterValues[filter.id] && 'text-muted-foreground'
									)}
									id={filter.id}
									variant="outline"
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{filterValues[filter.id]
										? filterValues[filter.id] instanceof Date
											? filterValues[filter.id].toLocaleDateString()
											: new Date(filterValues[filter.id]).toLocaleDateString()
										: filter.placeholder || 'Seleccionar fecha'}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<Calendar
									autoFocus
									mode="single"
									onSelect={(date) => updateFilterValue(filter.id, date)}
									selected={filterValues[filter.id] ? new Date(filterValues[filter.id]) : undefined}
								/>
							</PopoverContent>
						</Popover>
					</div>
				);

			case 'boolean':
				return (
					<div className="flex items-center space-x-2" key={filter.id}>
						<Checkbox
							checked={!!filterValues[filter.id]}
							id={filter.id}
							onCheckedChange={(checked) => updateFilterValue(filter.id, Boolean(checked))}
						/>
						<Label className="cursor-pointer" htmlFor={filter.id}>
							{filter.label}
						</Label>
					</div>
				);

			// Otros tipos de filtros pueden implementarse según sea necesario
			default:
				return null;
		}
	};

	return (
		<div className={cn('space-y-4', className)}>
			{/* Barra superior con búsqueda rápida y botones de acción */}
			<div className="flex flex-col gap-2 sm:flex-row">
				{/* Búsqueda rápida */}
				{showQuickSearch && (
					<div className="relative flex-1">
						<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							className="pl-8"
							onChange={(e) => setQuickSearch(e.target.value)}
							placeholder={searchPlaceholder}
							type="search"
							value={quickSearch}
						/>
					</div>
				)}

				{/* Botón de filtros avanzados */}
				<Popover onOpenChange={setIsFilterPanelOpen} open={isFilterPanelOpen}>
					<PopoverTrigger asChild>
						<Button
							className={cn('flex items-center gap-1', activeFiltersCount > 0 && 'bg-primary/10')}
							size="sm"
							variant="outline"
						>
							<SlidersHorizontal className="h-4 w-4" />
							<span>Filtros</span>
							{showActiveCount && activeFiltersCount > 0 && (
								<Badge className="ml-1 rounded-full px-1 py-0 text-xs" variant="secondary">
									{activeFiltersCount}
								</Badge>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-80 p-4 sm:w-[450px]">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="font-medium text-sm">Filtros avanzados</h3>
								{activeFiltersCount > 0 && (
									<Button className="h-8 px-2 text-xs" onClick={clearAllFilters} size="sm" variant="ghost">
										<RotateCcw className="mr-2 h-3 w-3" />
										{clearButtonText}
									</Button>
								)}
							</div>

							{/* Grid de filtros */}
							<div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
								{filters.map(renderFilter)}
							</div>

							{/* Filtros guardados */}
							{allowSavedFilters && (
								<div className="border-t pt-4">
									<h4 className="mb-2 font-medium text-sm">Filtros guardados</h4>

									{/* Lista de filtros guardados */}
									{savedFilters.length > 0 && (
										<div className="mb-4 space-y-2">
											{savedFilters.map((filter) => (
												<div className="flex items-center justify-between" key={filter.name}>
													<Button
														className="h-8 w-[calc(100%-36px)] justify-start px-2 text-left font-normal"
														onClick={() => applyFilter(filter)}
														size="sm"
														variant="ghost"
													>
														<Filter className="mr-2 h-3.5 w-3.5" />
														{filter.name}
													</Button>
													{onDeleteSavedFilter && (
														<Button
															className="h-8 w-8 p-0"
															onClick={() => onDeleteSavedFilter(filter.name)}
															size="sm"
															variant="ghost"
														>
															<Trash className="h-3.5 w-3.5 text-muted-foreground" />
														</Button>
													)}
												</div>
											))}
										</div>
									)}

									{/* Formulario para guardar filtro */}
									{onSaveFilter && (
										<div className="flex items-center gap-2">
											<Input
												onChange={(e) => setFilterName(e.target.value)}
												placeholder="Nombre del filtro"
												size={1}
												value={filterName}
											/>
											<Button
												disabled={!filterName.trim()}
												onClick={saveCurrentFilter}
												size="sm"
												type="button"
												variant="outline"
											>
												<Save className="mr-1 h-3.5 w-3.5" />
												Guardar
											</Button>
										</div>
									)}
								</div>
							)}
						</div>
					</PopoverContent>
				</Popover>

				{/* Mostrar filtros activos como badges */}
				{activeFiltersCount > 0 && (
					<Button className="hidden items-center gap-1 sm:flex" onClick={clearAllFilters} size="sm" variant="ghost">
						<RotateCcw className="mr-1 h-3.5 w-3.5" />
						Limpiar filtros
					</Button>
				)}
			</div>

			{/* Badges de filtros activos */}
			{activeFiltersCount > 0 && (
				<div className="flex flex-wrap gap-2">
					{Object.entries(filterValues)
						.filter(([key]) => key !== 'quickSearch')
						.map(([key, value]) => {
							// Omitir valores vacíos temprano
							const isEmptyArray = Array.isArray(value) && value.length === 0;
							if (value === undefined || value === null || value === '' || isEmptyArray) return null;

							// Buscar la definición de filtro correspondiente
							const filterDef = filters.find((f) => f.id === key);
							if (!filterDef) {
								return null;
							}

							// Formatear el valor para mostrar
							let displayValue = '';

							if (Array.isArray(value)) {
								// Para arrays, buscar las etiquetas correspondientes
								if (filterDef.options) {
									const labels = value.map(
										(v) => filterDef.options?.find((opt) => String(opt.value) === String(v))?.label || v
									);
									displayValue = labels.join(', ');
								} else {
									displayValue = value.join(', ');
								}
							} else if (typeof value === 'boolean') {
								// Para booleanos, mostrar el propio nombre del filtro
								displayValue = value ? 'Sí' : 'No';
							} else if (value instanceof Date) {
								// Para fechas, formatear como cadena legible
								displayValue = value.toLocaleDateString();
							} else if (typeof value === 'object' && value !== null) {
								// Para objetos, convertir a JSON
								displayValue = JSON.stringify(value);
							} else if (filterDef.options) {
								// Si hay opciones definidas, buscar la etiqueta correspondiente
								displayValue =
									filterDef.options.find((opt) => String(opt.value) === String(value))?.label || String(value);
							} else {
								displayValue = String(value);
							}

							return (
								<Badge className="flex items-center gap-1 py-1 pr-1 pl-2" key={key} variant="outline">
									<span className="font-medium">{filterDef.label}:</span>
									<span className="mr-1">{displayValue}</span>
									<Button
										className="h-5 w-5 rounded-full p-0"
										onClick={() => updateFilterValue(key, undefined)}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Trash className="h-3 w-3" />
									</Button>
								</Badge>
							);
						})}
				</div>
			)}
		</div>
	);
}
