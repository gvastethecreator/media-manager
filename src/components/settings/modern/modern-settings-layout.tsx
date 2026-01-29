/**
 * @file Layout moderno de Settings
 * @module components/settings/modern/modern-settings-layout
 * @description Layout actualizado con sidebar izquierda, breadcrumbs y diseño responsive
 */

import React, { useCallback, useState } from 'react';
import { ChevronRight, Search, Settings2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';

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
 * Componente de sidebar con categorías y items
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

	const filteredCategories = React.useMemo(() => {
		if (!searchTerm) return categories;

		const lower = searchTerm.toLowerCase();
		return categories
			.map((cat) => ({
				...cat,
				items: cat.items.filter(
					(item) =>
						item.label.toLowerCase().includes(lower) ||
						item.description?.toLowerCase().includes(lower)
				),
			}))
			.filter((cat) => cat.items.length > 0);
	}, [categories, searchTerm]);

	return (
		<ScrollArea className="flex h-full w-full">
			<div className="flex h-full w-full flex-col space-y-4 p-4">
				{/* Header de Settings */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
							<Settings2 className="h-4 w-4 text-primary" />
						</div>
						<span className="text-sm font-semibold">Configuración</span>
					</div>
				</div>

				<Separator className="bg-border/50" />

				{/* Search Bar */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Buscar configuración..."
						value={searchTerm}
						onChange={(e) => onSearch(e.target.value)}
						className="h-9 pl-9 text-sm"
					/>
					{searchTerm && (
						<button
							onClick={() => onSearch('')}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Categorías y Items */}
				<div className="flex flex-1 flex-col space-y-1">
					{filteredCategories.map((category) => {
						const isExpanded = expandedCategories.has(category.id) || searchTerm !== '';
						const isActive = activeCategory === category.id;

						return (
							<div key={category.id} className="space-y-1">
								{/* Category Header */}
								<button
									onClick={() => toggleCategory(category.id)}
									className={cn(
										'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
										isActive && 'bg-secondary/50',
										'hover:bg-secondary/30'
									)}
								>
									<div className="flex items-center gap-2">
										<span
											className={cn(
												'flex h-5 w-5 items-center justify-center rounded-md',
												isActive && 'bg-background shadow-sm'
											)}
											style={{ backgroundColor: isActive ? category.color : `${category.color}15` }}
										>
											<div
												className={cn('h-3 w-3', isActive && category.color)}
												style={isActive ? { color: category.color } : {}}
											>
												{category.icon}
											</div>
										</span>
										<span>{category.label}</span>
									</div>
									{category.badge && (
										<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
											{category.badge}
										</span>
									)}
								</button>

								{/* Items Expandibles */}
								{isExpanded && (
									<div className="ml-4 mt-1 flex flex-col space-y-0.5">
										{category.items.map((item) => {
											const isItemActive = activeItem === item.id;

											return (
												<button
													key={item.id}
													onClick={() => onNavigate(category.id, item.id)}
													className={cn(
														'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all duration-200',
														isItemActive && 'bg-primary/10 border border-primary/20',
														'hover:bg-secondary/40'
													)}
												>
													<div className="flex items-center gap-2.5">
														<div className={cn('h-4 w-4', isItemActive && 'text-primary')}>
															{item.icon}
														</div>
														<span className={isItemActive ? 'font-medium' : ''}>{item.label}</span>
													</div>
													<ChevronRight
														className={cn(
															'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
															isItemActive && 'rotate-90 text-primary'
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
 * Layout principal de Settings con sidebar izquierda
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
			{/* Sidebar Izquierda - Navegación */}
			<div className="h-full w-80 shrink-0 border-r bg-muted/30">
				<SettingsSidebar
					categories={categories}
					activeCategory={activeSection}
					activeItem={activeItemId}
					onNavigate={handleNavigate}
					searchTerm={searchTerm}
					onSearch={setSearchTerm}
				/>
			</div>

			{/* Área Principal - Contenido */}
			<div className="flex h-full flex-1 flex-col overflow-hidden">
				{/* Header Superior con Breadcrumbs */}
				<div className="flex h-14 shrink-0 items-center justify-between border-b px-6">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/settings" className="text-muted-foreground hover:text-foreground">
									<Settings2 className="h-4 w-4" />
								</BreadcrumbLink>
							</BreadcrumbItem>
							{activeCategory && (
								<BreadcrumbItem>
									<ChevronRight className="h-4 w-4 text-muted-foreground/50" />
									<BreadcrumbPage className="text-muted-foreground hover:text-foreground">
										{activeCategory.label}
									</BreadcrumbPage>
								</BreadcrumbItem>
							)}
							{activeItem && (
								<BreadcrumbItem>
									<ChevronRight className="h-4 w-4 text-muted-foreground/50" />
									<BreadcrumbPage>{activeItem.label}</BreadcrumbPage>
								</BreadcrumbItem>
							)}
						</BreadcrumbList>
					</Breadcrumb>

					{/* Acciones rápidas del header */}
					<div className="flex items-center gap-2">
						{activeItem && (
							<div className="flex h-8 items-center gap-2 rounded-full border bg-background px-3 shadow-sm">
								<span
									className="flex h-4 w-4 items-center justify-center rounded-full"
									style={{ backgroundColor: activeItem.color }}
								>
									<div className="h-2.5 w-2.5 text-white">{activeItem.icon}</div>
								</span>
								<span className="text-xs font-medium">{activeItem.label}</span>
							</div>
						)}
					</div>
				</div>

				{/* Contenido Scrollable */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-6">{children}</div>
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
			categories={categories}
			activeSection={activeSection}
			activeItemId={activeItemId}
			onNavigate={handleNavigate}
		>
			{children}
		</ModernSettingsLayout>
	);
}
