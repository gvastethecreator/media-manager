import { CalendarIcon, Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

export type FilterType = 'text' | 'select' | 'checkbox' | 'radio' | 'date' | 'boolean';

export interface FilterOption {
	value: string | number | boolean;
	label: string;
}

export interface FilterDefinition {
	id: string;
	type: FilterType;
	label: string;
	placeholder?: string;
	options?: FilterOption[];
}

export interface FilterPanelProps {
	filters: FilterDefinition[];
	className?: string;
}

/**
 * Panel de filtros avanzados para el FileBrowser
 * Se integra con el store de ViewOptions para aplicar filtros
 */
export const FilterPanel = memo<FilterPanelProps>(function FilterPanel({ filters, className }) {
	// Estado local para el panel
	const [isOpen, setIsOpen] = useState(false);

	// Acceder al store de opciones de vista
	const filterOptions = useViewOptionsStore((state) => state.filterOptions);
	const addFilterOption = useViewOptionsStore((state) => state.addFilterOption);
	const removeFilterOption = useViewOptionsStore((state) => state.removeFilterOption);
	const resetFilters = useViewOptionsStore((state) => state.resetFilters);

	// Contar filtros activos
	const activeFiltersCount = filterOptions.length;

	// Función para aplicar un filtro
	const applyFilter = useCallback(
		(id: string, value: any, operator: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' = 'eq') => {
			if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
				removeFilterOption(id);
			} else {
				addFilterOption({ field: id, value, operator });
			}
		},
		[addFilterOption, removeFilterOption]
	);

	// Obtener el valor actual de un filtro
	const getFilterValue = useCallback(
		(id: string) => {
			const filter = filterOptions.find((opt) => opt.field === id);
			return filter ? filter.value : undefined;
		},
		[filterOptions]
	);

	// Renderizar un filtro según su tipo
	const renderFilter = useCallback(
		(filter: FilterDefinition) => {
			const currentValue = getFilterValue(filter.id);

			switch (filter.type) {
				case 'text':
					return (
						<div className="space-y-2" key={filter.id}>
							<Label htmlFor={filter.id}>{filter.label}</Label>
							<Input
								id={filter.id}
								value={typeof currentValue === 'boolean' ? '' : currentValue || ''}
								onChange={(e) => applyFilter(filter.id, e.target.value, 'contains')}
								placeholder={filter.placeholder}
							/>
						</div>
					);

				case 'select':
					return (
						<div className="space-y-2" key={filter.id}>
							<Label htmlFor={filter.id}>{filter.label}</Label>
							<Select value={currentValue?.toString() || ''} onValueChange={(value) => applyFilter(filter.id, value)}>
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
											id={`${filter.id}-${option.value}`}
											checked={Array.isArray(currentValue) && currentValue?.includes(option.value)}
											onCheckedChange={(checked) => {
												const values = Array.isArray(currentValue) ? [...currentValue] : [];
												if (checked) {
													applyFilter(filter.id, [...values, option.value]);
												} else {
													applyFilter(
														filter.id,
														values.filter((v) => v !== option.value)
													);
												}
											}}
										/>
										<Label htmlFor={`${filter.id}-${option.value}`} className="cursor-pointer">
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
								value={currentValue?.toString() || ''}
								onValueChange={(value) => applyFilter(filter.id, value)}
							>
								<div className="space-y-2">
									{filter.options?.map((option) => (
										<div className="flex items-center space-x-2" key={String(option.value)}>
											<RadioGroupItem value={String(option.value)} id={`${filter.id}-${option.value}`} />
											<Label htmlFor={`${filter.id}-${option.value}`} className="cursor-pointer">
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
										id={filter.id}
										variant="outline"
										className={cn(
											'w-full justify-start text-left font-normal',
											!currentValue && 'text-muted-foreground'
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
						{currentValue
							? (() => {
									try {
										const date = currentValue instanceof Date ? currentValue : new Date(currentValue as string | number);
										return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Fecha inválida';
									} catch {
										return 'Fecha inválida';
									}
							  })()
							: filter.placeholder || 'Seleccionar fecha'}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={currentValue ? new Date(currentValue as string | number) : undefined}
										onSelect={(date) => applyFilter(filter.id, date)}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
					);

				case 'boolean':
					return (
						<div className="flex items-center space-x-2" key={filter.id}>
							<Checkbox
								id={filter.id}
								checked={!!currentValue}
								onCheckedChange={(checked) => applyFilter(filter.id, Boolean(checked))}
							/>
							<Label htmlFor={filter.id} className="cursor-pointer">
								{filter.label}
							</Label>
						</div>
					);

				default:
					return null;
			}
		},
		[applyFilter, getFilterValue]
	);

	return (
		<div className={cn('flex items-center', className)}>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className={cn('flex items-center gap-1', activeFiltersCount > 0 && 'bg-primary/10')}
					>
						<SlidersHorizontal className="h-4 w-4" />
						<span>Filtros</span>
						{activeFiltersCount > 0 && (
							<Badge variant="secondary" className="ml-1 rounded-full px-1 py-0 text-xs">
								{activeFiltersCount}
							</Badge>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80 p-4" align="end">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Filtros avanzados</h3>
							{activeFiltersCount > 0 && (
								<Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
									<RotateCcw className="mr-2 h-3 w-3" />
									Limpiar filtros
								</Button>
							)}
						</div>

						{/* Grid de filtros */}
						<div className="grid gap-4 grid-cols-1">{filters.map(renderFilter)}</div>

						{/* Botones de acción */}
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
								Cerrar
							</Button>
							<Button size="sm" onClick={() => setIsOpen(false)}>
								Aplicar
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>

			{/* Mostrar filtros activos */}
			{activeFiltersCount > 0 && (
				<Button variant="ghost" size="sm" onClick={resetFilters} className="ml-2 h-8">
					<Filter className="h-3.5 w-3.5 mr-1" />
					<span className="text-xs">Limpiar</span>
				</Button>
			)}
		</div>
	);
});
