/**
 * Cliente de API para estadísticas del sistema.
 */
import type { SystemStats } from '@/lib/api/system';

const API_BASE_PATH = '/api/stats';

export async function getSystemStatsFromApi(): Promise<SystemStats> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) throw new Error('Error al obtener estadísticas');
	return response.json();
}

export async function invalidateStatsInApi(): Promise<void> {
	const response = await fetch(`${API_BASE_PATH}/invalidate`, { method: 'POST' });
	if (!response.ok) throw new Error('Error al invalidar estadísticas');
}
