/**
 * @file Layout moderno de Settings - Rediseñado al estilo NavPanel
 * @module components/settings/modern/modern-settings-layout
 * @description Layout compacto con colores de entidad y diseño consistente con el navigation panel
 */

import { ChevronRight, Search, Settings2, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Tipos para los items de navegación
export interface SettingsNavItem {
	id: string;
	label: string;
	icon: React.ReactNode;
	color: string;
	description?: string;
}

export interface SettingsCategory {
	id: string;
	label: string;
	icon: React.ReactNode;
	color: string;
	items: SettingsNavItem[];
	badge?: number;
}

interface ModernSettingsLayoutProps {
	categories: SettingsCategory[];
	children: React.ReactNode;
	activeSection?: string;
	activeItemId?: string;
	onNavigate?: (categoryId: string, itemId: string) => void;
}

/**
 * Componente de sidebar con diseño compacto estilo NavPanel
 */
function SettingsSidebar({
	categories,
	activeCategory,
	activeItem,
	onNavigate,
	searchTerm,
	onSearch,
}: {
	categories: SettingsCategory[];
	activeCategory?: string;
	activeItem?: string;
	onNavigate: (categoryId: string, itemId: string) => void;
	searchTerm: string;
	onSearch: (term: string) => void;
}) {
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(categories.slice(0, 3).map((c) => c.id))
	);

	const toggleCategory = useCallback((categoryId: string) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(categoryId)) {
				next.delete(categoryId);
			} else {
				next.add(categoryId);
			}
			return next;
		});
	}, []);

	const filteredCategories = useMemo(() => {
		if (!searchTerm) return categories;

		const lower = searchTerm.toLowerCase();
		return categories
			.map((cat) => ({
				...cat,
				items: cat.items.filter(
					(item) => item.label.toLowerCase().includes(lower) || item.description?.toLowerCase().includes(lower)
				),
			}))
			.filter((cat) => cat.items.length > 0);
	}, [categories, searchTerm]);

	return (
		<ScrollArea className="flex h-full w-full">
			<div className="flex h-full w-full flex-col py-2">
				{/* Header de Settings - Estilo NavPanelHeader */}
				<div className="px-2 pb-2">
					<div className="flex items-center gap-2 px-2 py-1.5">
						<div
							className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
							style={{
								backgroundColor: 'color-mix(in oklch, var(--primary) 15%, transparent)',
							}}
						>
							<Settings2 className="h-3.5 w-3.5 text-primary" />
						</div>
						<span className="flex-1 truncate font-semibold text-xs">Configuración</span>
					</div>
				</div>

				<Separator className="bg-border/30" />

				{/* Search Bar - Compacto */}
				<div className="px-2 py-2">
					<div className="relative">
						<Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="h-8 pr-7 pl-8 text-xs"
							onChange={(e) => onSearch(e.target.value)}
							placeholder="Buscar..."
							value={searchTerm}
						/>
						{searchTerm && (
							<button
								className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
								onClick={() => onSearch('')}
								type="button"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						)}
					</div>
				</div>

				{/* Categorías y Items - Estilo NavMainNavigation */}
				<div className="flex flex-1 flex-col gap-0.5 px-1">
					{filteredCategories.map((category) => {
						const isExpanded = expandedCategories.has(category.id) || searchTerm !== '';
						const isCategoryActive = activeCategory === category.id;

						return (
							<div className="mb-1" key={category.id}>
								{/* Category Header - Compacto con color de entidad */}
								<button
									className={cn(
										'group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-all duration-200',
										'hover:bg-secondary/40',
										isCategoryActive && 'bg-secondary/60'
									)}
									onClick={() => {
										if (category.items.length > 0) {
											onNavigate(category.id, category.items[0].id);
										}
										if (!(isExpanded || searchTerm)) {
											toggleCategory(category.id);
										}
									}}
									type="button"
								>
									{/* Icono con color de entidad */}
									<div className="flex h-4 w-4 shrink-0 items-center justify-center" style={{ color: category.color }}>
										{category.icon}
									</div>

									{/* Label con color de entidad */}
									<span
										className={cn('flex-1 truncate font-semibold', isCategoryActive ? 'text-foreground' : '')}
										style={{ color: isCategoryActive ? undefined : category.color }}
									>
										{category.label}
									</span>

									{/* Badge de conteo */}
									{category.badge ? (
										<span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 font-medium text-[10px] text-muted-foreground">
											{category.badge}
										</span>
									) : (
										<span className="text-[10px] text-muted-foreground">{category.items.length}</span>
									)}

									{/* Chevron indicator */}
									<ChevronRight
										className={cn(
											'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
											isExpanded && 'rotate-90'
										)}
									/>
								</button>

								{/* Items Expandibles - Estilo compacto */}
								{isExpanded && (
									<div className="mt-0.5 ml-4 flex flex-col gap-0.5 border-border/30 border-l pl-2">
										{category.items.map((item) => {
											const isItemActive = activeItem === item.id;

											return (
												<button
													className={cn(
														'group flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-all duration-200',
														'hover:bg-secondary/50',
														isItemActive && 'bg-secondary font-medium'
													)}
													key={item.id}
													onClick={() => onNavigate(category.id, item.id)}
													type="button"
												>
													<div className="flex min-w-0 flex-1 items-center gap-2">
														{/* Indicador lateral para item activo */}
														{isItemActive && (
															<div className="h-3 w-0.5 rounded-full" style={{ backgroundColor: item.color }} />
														)}

														{/* Icono del item */}
														<div
															className="flex h-3 w-3 shrink-0 items-center justify-center"
															style={{ color: isItemActive ? item.color : 'var(--muted-foreground)' }}
														>
															{item.icon}
														</div>

														{/* Label del item */}
														<span
															className={cn('truncate', isItemActive ? 'text-foreground' : 'text-muted-foreground')}
														>
															{item.label}
														</span>
													</div>

													{/* Indicador de activo (chevron) */}
													<ChevronRight
														className={cn(
															'h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200',
															isItemActive && 'rotate-90 text-foreground'
														)}
													/>
												</button>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}

/**
 * Layout principal de Settings con sidebar izquierda estilo NavPanel
 */
export function ModernSettingsLayout({
	categories,
	children,
	activeSection,
	activeItemId,
	onNavigate,
}: ModernSettingsLayoutProps) {
	const [searchTerm, setSearchTerm] = useState('');

	// Encontrar categoría e item activos
	const activeCategory = categories.find((c) => c.id === activeSection);
	const activeItem = activeCategory?.items.find((i) => i.id === activeItemId);

	const handleNavigate = useCallback(
		(categoryId: string, itemId: string) => {
			onNavigate?.(categoryId, itemId);
		},
		[onNavigate]
	);

	return (
		<div className="flex h-full w-full overflow-hidden bg-background">
			{/* Sidebar Izquierda - Navegación estilo NavPanel */}
			<div className="h-full w-72 shrink-0 border-border/30 border-r bg-muted/20">
				<SettingsSidebar
					activeCategory={activeSection}
					activeItem={activeItemId}
					categories={categories}
					onNavigate={handleNavigate}
					onSearch={setSearchTerm}
					searchTerm={searchTerm}
				/>
			</div>

			{/* Área Principal - Contenido */}
			<div className="flex h-full flex-1 flex-col overflow-hidden">
				{/* Header Superior con Breadcrumbs - Más compacto */}
				<div className="flex h-12 shrink-0 items-center justify-between border-border/30 border-b bg-gradient-to-b from-background/90 to-transparent px-4 shadow-sm">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink
									className="text-muted-foreground transition-colors hover:text-foreground"
									href="/settings"
								>
									<Settings2 className="h-3.5 w-3.5" />
								</BreadcrumbLink>
							</BreadcrumbItem>
							{activeCategory && (
								<BreadcrumbItem>
									<ChevronRight className="h-3 w-3 text-muted-foreground/50" />
									<BreadcrumbPage
										className="text-muted-foreground transition-colors hover:text-foreground"
										style={{ color: activeCategory.color }}
									>
										{activeCategory.label}
									</BreadcrumbPage>
								</BreadcrumbItem>
							)}
							{activeItem && (
								<BreadcrumbItem>
									<ChevronRight className="h-3 w-3 text-muted-foreground/50" />
									<BreadcrumbPage className="text-foreground">{activeItem.label}</BreadcrumbPage>
								</BreadcrumbItem>
							)}
						</BreadcrumbList>
					</Breadcrumb>

					{/* Indicador de item activo con color */}
					{activeItem && (
						<div className="flex h-7 items-center gap-2 rounded-full border border-border/50 bg-background px-2.5 shadow-sm">
							<div
								className="flex h-3 w-3 items-center justify-center rounded-full"
								style={{ backgroundColor: activeItem.color }}
							>
								<div className="h-2 w-2" style={{ color: 'var(--primary-foreground)' }}>
									{activeItem.icon}
								</div>
							</div>
							<span className="font-medium text-[11px]">{activeItem.label}</span>
						</div>
					)}
				</div>

				{/* Contenido Scrollable */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-5">{children}</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	);
}

/**
 * Wrapper de layout con URL params
 */
export function ModernSettingsLayoutWrapper({
	categories,
	children,
}: {
	categories: SettingsCategory[];
	children: React.ReactNode;
}) {
	const [searchParams, setSearchParams] = React.useState(new URLSearchParams(window.location.search));

	const activeSection = searchParams.get('section') || categories[0]?.id;
	const activeItemId = searchParams.get('item') || categories[0]?.items[0]?.id;

	const handleNavigate = useCallback((section: string, item: string) => {
		setSearchParams(new URLSearchParams({ section, item }));
	}, []);

	return (
		<ModernSettingsLayout
			activeItemId={activeItemId}
			activeSection={activeSection}
			categories={categories}
			onNavigate={handleNavigate}
		>
			{children}
		</ModernSettingsLayout>
	);
}
