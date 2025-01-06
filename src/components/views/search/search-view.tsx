"use client";

import { useState, useCallback } from "react";
import { ViewProps } from "../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileItem } from "@/types/file-item";
import { useFileManager } from "@/store/file-manager";
import { useImageViewer } from "@/store/image-viewer";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { LoadingSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { Search } from "lucide-react";
import { LoadingScreen } from "@/components/core/feedback";

interface SearchFilters {
	query: string;
	type: "name" | "content" | "metadata" | "all";
	dateFrom?: Date;
	dateTo?: Date;
	tags?: string[];
	collections?: string[];
	folders?: string[];
}

const PAGE_SIZE = 100;

export function SearchView({ isResizing }: ViewProps) {
	const [filters, setFilters] = useState<SearchFilters>({
		query: "",
		type: "all",
	});

	const {
		currentItems: items,
		selectedItem,
		selectedItems,
		toggleItemSelection,
		loadItems,
		isLoading,
		isProcessingThumbnails,
	} = useFileManager();
	const { openViewer } = useImageViewer();

	const handleSearch = useCallback(() => {
		if (filters.query) {
			loadItems(
				`/api/search?query=${encodeURIComponent(filters.query)}&type=${
					filters.type
				}`
			);
		}
	}, [filters, loadItems]);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			toggleItemSelection(item, false);
		},
		[toggleItemSelection]
	);

	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			if (item.type === "image" || item.mimeType?.startsWith("image/")) {
				const imageItems = (items || []).filter(
					(i) => i.type === "image" || i.mimeType?.startsWith("image/")
				);
				openViewer(
					imageItems,
					imageItems.findIndex((i) => i.id === item.id)
				);
			}
		},
		[openViewer, items]
	);

	return (
		<div className="h-full flex flex-col">
			<Card className="m-6">
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex gap-4">
							<Input
								placeholder="Buscar imágenes..."
								value={filters.query}
								onChange={(e) =>
									setFilters((prev) => ({ ...prev, query: e.target.value }))
								}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleSearch();
									}
								}}
							/>
							<Button onClick={handleSearch}>Buscar</Button>
						</div>

						<Tabs defaultValue="basic" className="w-full">
							<TabsList>
								<TabsTrigger value="basic">Básica</TabsTrigger>
								<TabsTrigger value="advanced">Avanzada</TabsTrigger>
							</TabsList>
							<TabsContent value="basic">
								{/* TODO: Implementar filtros básicos */}
							</TabsContent>
							<TabsContent value="advanced">
								{/* TODO: Implementar filtros avanzados */}
							</TabsContent>
						</Tabs>
					</div>
				</CardContent>
			</Card>

			<div className="flex-1 overflow-auto p-6">
				{isLoading ? (
					<LoadingScreen />
				) : items && items.length > 0 ? (
					<FileGrid
						items={items}
						onItemClick={handleItemClick}
						onItemDoubleClick={handleItemDoubleClick}
					/>
				) : filters.query ? (
					<EmptyState
						icon={Search}
						title="No se encontraron resultados"
						description="Intenta con otros términos de búsqueda"
					/>
				) : null}
			</div>
		</div>
	);
}
