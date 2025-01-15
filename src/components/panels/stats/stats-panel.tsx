/**
 * Componente Client para el panel de estadísticas
 * Maneja la UI interactiva y los elementos client-side
 * Delega la lógica de datos al StatsContent (Server Component)
 */

"use client";

import { StatsContainer } from "./base/stats-view";
import { StatsContent } from "./stats-content";

export function StatsPanel() {
	return (
		<StatsContainer>
			<StatsContent />
		</StatsContainer>
	);
}
