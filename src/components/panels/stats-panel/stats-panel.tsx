/**
 * Componente Client para el panel de estadísticas
 * Maneja la UI interactiva y los elementos client-side
 * Delega la lógica de datos al StatsContent (Server Component)
 */

import { memo } from 'react';
// Importamos el wrapper de estadísticas de manera estática ya que ahora es un componente cliente
import StatsWrapper from './components/stats-wrapper';
import StatsClientWrapper from './stats-client';

// Componente optimizado con memo para estadísticas
const StatsPanel = memo(function StatsPanel() {
	return (
		<StatsClientWrapper>
			<StatsWrapper />
		</StatsClientWrapper>
	);
});

// Exportación por defecto
export default StatsPanel;

// También exportamos versión con nombre
export { StatsPanel };
