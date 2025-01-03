"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDetails } from "@/components/features/file-details/file-details";
import { useFileSelection } from "@/store/file-selection";

export function RightPanel() {
	const { selectedItems } = useFileSelection();

	return (
		<div className="flex flex-col h-full">
			<ScrollArea className="flex-1">
				<FileDetails selectedItems={selectedItems} />
			</ScrollArea>
		</div>
	);
}
