"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DetailsPanel } from "@/components/panels/details/details-panel";
import { useFileManager } from "@/store/file-manager.store";
import { motion, AnimatePresence } from "motion/react";
import { Meteors } from "../ui/meteors";

export function RightPanel() {
	const { selectedItems } = useFileManager();

	return (
		<div className="flex flex-col h-full">
			<AnimatePresence mode="wait">
				{selectedItems.length > 0 ?
					<motion.div
						key="details"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						className="flex-1"
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
					>
						<ScrollArea className="h-full">
							<DetailsPanel selectedItems={selectedItems} />
						</ScrollArea>
					</motion.div>
				:	<motion.div
						key="info"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="flex-1"
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
					>
						<div className="flex-1 w-full h-full relative">
							<Meteors />
						</div>
					</motion.div>
				}
			</AnimatePresence>
		</div>
	);
}
