"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDetails } from "@/components/features/file-details/file-details";
import { useFileManager } from "@/store/file-manager";

export function RightPanel() {
	const { selectedItems } = useFileManager();

	return (
		<div className="flex flex-col h-full">
			<ScrollArea className="flex-1">
				<FileDetails selectedItems={selectedItems} />
			</ScrollArea>
		</div>
	);
}
