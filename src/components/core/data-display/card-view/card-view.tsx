"use client";

import * as React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	motion,
	LazyMotion,
	domAnimation,
	m,
	type Variants,
} from "motion/react";
import { FolderIcon, TagIcon, BookmarkIcon } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ImageFallback } from "@/components/ui/image-fallback";

export interface CardItem {
	id: string;
	name: string;
	description: string;
	thumbnails: string[];
	count: number;
	totalSize: string;
	tags: string[];
	color: string;
	emoji?: string;
}

interface CardViewProps {
	items: (CardItem & { type?: "collections" | "folders" | "tags" })[];
	type: "collections" | "folders" | "tags" | "cards";
	onSelect?: (
		item: CardItem & { type?: "collections" | "folders" | "tags" }
	) => void;
}

const container: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.03,
			delayChildren: 0.05,
		},
	},
};

const itemAnimation: Variants = {
	hidden: { opacity: 0, y: 5 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			type: "tween",
			duration: 0.2,
			ease: "easeOut",
		},
	},
};

const getIcon = (
	type: "collections" | "folders" | "tags" | "cards",
	itemType?: "collections" | "folders" | "tags"
) => {
	if (type === "cards" && itemType) {
		return getIcon(itemType);
	}
	switch (type) {
		case "collections":
			return BookmarkIcon;
		case "folders":
			return FolderIcon;
		case "tags":
			return TagIcon;
		case "cards":
			return BookmarkIcon; // Default icon for cards view
	}
};

// Optimized thumbnail grid component
const ThumbnailGrid = React.memo(
	({
		thumbnails,
		cardId,
		name,
	}: {
		thumbnails: string[];
		cardId: string;
		name: string;
	}) => {
		const visibleThumbnails = React.useMemo(
			() =>
				thumbnails.slice(0, 9).map((thumbnail, index) => (
					<div
						key={`${cardId}-thumb-${index}`}
						className="relative overflow-hidden aspect-[3/4]"
					>
						<ImageFallback
							src={thumbnail}
							alt={`${name} thumbnail ${index + 1}`}
							className="w-full h-full object-cover rounded-md transition-transform duration-300 hover:scale-105"
							loading="lazy"
							decoding="async"
							gradientColors={[
								`hsl(${(index * 40) % 360}, 95%, 75%)`,
								`hsl(${(index * 40 + 60) % 360}, 95%, 75%)`,
							]}
						/>
					</div>
				)),
			[thumbnails, cardId, name]
		);

		const emptyThumbnails = React.useMemo(
			() =>
				Array.from({ length: Math.max(0, 9 - thumbnails.length) }).map(
					(_, index) => (
						<div
							key={`${cardId}-empty-${index}`}
							className="relative overflow-hidden rounded-md bg-muted/50 aspect-[3/4]"
						/>
					)
				),
			[thumbnails.length, cardId]
		);

		return (
			<div className="grid grid-cols-3 gap-2 aspect-[3/4]">
				{visibleThumbnails}
				{emptyThumbnails}
			</div>
		);
	}
);
ThumbnailGrid.displayName = "ThumbnailGrid";

// Optimized card component
const CardItemComponent = React.memo(
	({
		item,
		type,
		Icon,
		onSelect,
		style,
	}: {
		item: CardItem & { type?: "collections" | "folders" | "tags" };
		type: "collections" | "folders" | "tags" | "cards";
		Icon: React.ElementType;
		onSelect?: (
			item: CardItem & { type?: "collections" | "folders" | "tags" }
		) => void;
		style?: React.CSSProperties;
	}) => {
		// Determine the icon based on the item type for unified view
		const ItemIcon =
			type === "cards" && item.type ? getIcon(type, item.type) : Icon;

		return (
			<m.div variants={itemAnimation} style={style} className="h-[600px]">
				<Card
					className={cn(
						"group overflow-hidden hover:shadow-md cursor-pointer border-2 h-full",
						"hover:scale-[1.01] transition-all duration-150 bg-card/50"
					)}
					style={{ borderColor: `${item.color}40` }}
					onClick={() => onSelect?.(item)}
				>
					<CardHeader className="pb-2 px-4 pt-4">
						<CardTitle className="text-xl font-bold flex items-center gap-2">
							{type === "collections" && item.emoji ? (
								<span className="text-2xl">{item.emoji}</span>
							) : (
								<ItemIcon className="h-5 w-5" style={{ color: item.color }} />
							)}
							<span className="truncate">{item.name}</span>
						</CardTitle>
						{item.description && (
							<CardDescription className="line-clamp-2">
								{item.description}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent className="px-4 flex-grow">
						<ThumbnailGrid
							thumbnails={item.thumbnails}
							cardId={item.id}
							name={item.name}
						/>
					</CardContent>
					<CardFooter className="flex flex-col items-start gap-2 px-4 pb-4 mt-auto">
						<div className="flex justify-between w-full text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<ItemIcon className="h-4 w-4" />
								{item.count}{" "}
								{type === "collections" ||
								(type === "cards" && item.type === "collections")
									? "imágenes"
									: type === "folders" ||
									  (type === "cards" && item.type === "folders")
									? "archivos"
									: "elementos"}
							</span>
							<span>{item.totalSize}</span>
						</div>
						{item.tags && item.tags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{item.tags.map((tag) => (
									<Badge
										key={`${item.id}-${tag}`}
										variant="secondary"
										className="bg-muted/50 text-xs"
									>
										{tag}
									</Badge>
								))}
							</div>
						)}
					</CardFooter>
				</Card>
			</m.div>
		);
	}
);
CardItemComponent.displayName = "CardItemComponent";

export function CardView({ items, type, onSelect }: CardViewProps) {
	const Icon = React.useMemo(() => getIcon(type), [type]);
	const parentRef = React.useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = React.useState(0);

	// Update container width on mount and resize
	React.useEffect(() => {
		const updateWidth = () => {
			if (parentRef.current) {
				setContainerWidth(parentRef.current.clientWidth);
			}
		};
		updateWidth();
		const observer = new ResizeObserver(updateWidth);
		if (parentRef.current) {
			observer.observe(parentRef.current);
		}
		return () => observer.disconnect();
	}, []);

	// Calculate columns based on container width
	const columns = Math.max(1, Math.floor(containerWidth / 350));
	const rows = Math.ceil(items.length / columns);
	const rowHeight = 650; // Fixed height for each row including gap

	const rowVirtualizer = useVirtualizer({
		count: rows,
		getScrollElement: () => parentRef.current,
		estimateSize: () => rowHeight,
		overscan: 3,
	});

	return (
		<LazyMotion features={domAnimation} strict>
			<div ref={parentRef} className="h-full overflow-auto px-6 py-6">
				<m.div
					variants={container}
					initial="hidden"
					animate="show"
					className="relative w-full"
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
						width: "100%",
					}}
				>
					{rowVirtualizer.getVirtualItems().map((virtualRow) => {
						const rowStartIndex = virtualRow.index * columns;
						const rowEndIndex = Math.min(
							(virtualRow.index + 1) * columns,
							items.length
						);
						const rowItems = items.slice(rowStartIndex, rowEndIndex);

						return (
							<div
								key={virtualRow.index}
								className={cn(
									"absolute left-0 right-0 grid gap-6",
									columns === 1
										? "grid-cols-1"
										: columns === 2
										? "grid-cols-2"
										: columns === 3
										? "grid-cols-3"
										: "grid-cols-4"
								)}
								style={{
									top: 0,
									transform: `translateY(${virtualRow.start}px)`,
									height: `${rowHeight}px`,
								}}
							>
								{rowItems.map((item) => (
									<CardItemComponent
										key={item.id}
										item={item}
										type={type}
										Icon={Icon}
										onSelect={onSelect}
									/>
								))}
							</div>
						);
					})}
				</m.div>
			</div>
		</LazyMotion>
	);
}
