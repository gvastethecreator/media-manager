/**
 * Componente Client para el panel de estadísticas
 * Maneja la UI interactiva y los elementos client-side
 * Delega la lógica de datos al StatsContent (Server Component)
 */

"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Meteors } from "@/components/ui/meteors";
import { StatsContent } from "./stats-content";

export function StatsPanel() {
	return (
		<ScrollArea className="h-full w-full p-0">
			<div className="p-0 w-full h-full">
				<Meteors />
				<StatsContent />
			</div>
		</ScrollArea>
	);
}
