"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DetailsPanel } from "@/components/panels/details/details-panel";
import { InfoPanel } from "@/components/panels/info/info-panel";
import { StatsPanel } from "@/components/panels/stats/stats-panel";
import { useFileManager } from "@/store/file-manager.store";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RightPanel() {
	const { selectedItems } = useFileManager();

	return (
		<div className="flex flex-col h-full">
			<AnimatePresence mode="wait">
				{selectedItems.length > 0 ? (
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
				) : (
					<motion.div
						key="info"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="flex-1"
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
					>
						<Tabs defaultValue="info" className="h-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="info">Información</TabsTrigger>
								<TabsTrigger value="stats">Estadísticas</TabsTrigger>
							</TabsList>
							<TabsContent value="info" className="h-[calc(100%-48px)]">
								<InfoPanel />
							</TabsContent>
							<TabsContent value="stats" className="h-[calc(100%-48px)]">
								<StatsPanel />
							</TabsContent>
						</Tabs>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
