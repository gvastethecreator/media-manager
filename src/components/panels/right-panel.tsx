"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DetailsPanel } from "@/components/panels/details/details-panel";
import { InfoPanel } from "@/components/panels/info/info-panel";
import { useFileManager } from "@/store/file-manager";

export function RightPanel() {
	const { selectedItems } = useFileManager();

	return (
		<div className="flex flex-col h-full">
			{selectedItems.length > 0 ? (
				<ScrollArea className="flex-1">
					<DetailsPanel selectedItems={selectedItems} />
				</ScrollArea>
			) : (
				<InfoPanel />
			)}
		</div>
	);
}
