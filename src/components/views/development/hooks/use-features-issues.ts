import { BookImage, Cloud, Database, Folder, ImageIcon, Server, Settings, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Feature } from '../cards/feature-card';
import type { Issue } from '../cards/issue-card';
import { ServiceStatus } from '../cards/service-card';
import { getFeatures, getIssues, getServices } from '../services/features-issues';

/**
 * Hook personalizado para gestionar features, issues y servicios
 * Optimizado para React 19 con memoización y transiciones suaves
 */
export function useFeaturesIssues() {
	// Estados base con inicialización optimizada para React 19
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [features, setFeatures] = useState<Feature[]>([]);
	const [issues, setIssues] = useState<Issue[]>([]);
	const [services, setServices] = useState<ServiceStatus[]>([]);
	const [updateTimestamp, setUpdateTimestamp] = useState(() => Date.now());

	// Mapa de iconos memoizado para evitar recreaciones en cada render
	const iconMap = useMemo(
		() => ({
			'Indexación de Archivos': Folder,
			'Procesamiento de Imágenes': ImageIcon,
			'Base de Datos': Database,
			'API REST': Server,
			'Sistema de Caché': Zap,
			'Background Jobs': Settings,
			'Reconocimiento de Imágenes': BookImage,
			Sincronización: Cloud,
			default: Server,
		}),
		[]
	);

	// Función para obtener datos, optimizada para React 19
	const fetchData = useCallback(
		async (showLoadingIndicator = true) => {
			if (showLoadingIndicator) {
				setIsLoading(true);
			}

			try {
				// Uso de Promise.all para paralelizar peticiones
				const [featuresData, issuesData, servicesData] = await Promise.all([getFeatures(), getIssues(), getServices()]);

				// Mapeo optimizado con asignación directa de componentes de icono
				const servicesWithIcons = servicesData.map((service) => {
					// Obtener el componente de icono desde el mapa
					const iconComponent = iconMap[service.name as keyof typeof iconMap] || iconMap.default;

					// Devolver el servicio con el componente como icon
					return {
						...service,
						icon: iconComponent,
					} as ServiceStatus;
				});

				// Actualización de estado con retardo mínimo para transiciones suaves
				setTimeout(() => {
					// Actualizaciones de estado agrupadas para minimizar re-renders
					setFeatures(featuresData);
					setIssues(issuesData);
					setServices(servicesWithIcons);
					setUpdateTimestamp(Date.now());

					if (showLoadingIndicator) {
						setIsLoading(false);
					}

					if (isInitialLoading) {
						setIsInitialLoading(false);
					}
				}, 50);
			} catch (error) {
				console.error('Error al obtener datos de features e issues:', error);
				if (showLoadingIndicator) {
					setIsLoading(false);
				}
			}
		},
		[iconMap, isInitialLoading]
	);

	// Efecto para carga inicial y actualizaciones periódicas
	useEffect(() => {
		// Carga inicial con indicador de carga
		fetchData(true);

		// Intervalo para actualizaciones periódicas sin indicador de carga
		const intervalId = setInterval(() => {
			fetchData(false);
		}, 60000);

		// Limpieza del intervalo al desmontar
		return () => clearInterval(intervalId);
	}, [fetchData]);

	// Cálculos derivados memoizados para evitar recómputos innecesarios
	const featuresByStatus = useMemo(
		() => ({
			completed: features.filter((f) => f.status === 'completed').length,
			inProgress: features.filter((f) => f.status === 'in-progress').length,
			pending: features.filter((f) => f.status === 'pending').length,
			total: features.length,
		}),
		[features]
	);

	const issuesByStatus = useMemo(
		() => ({
			open: issues.filter((i) => i.status === 'open').length,
			inProgress: issues.filter((i) => i.status === 'in-progress').length,
			resolved: issues.filter((i) => i.status === 'resolved').length,
			total: issues.length,
		}),
		[issues]
	);

	const servicesByStatus = useMemo(
		() => ({
			online: services.filter((s) => s.status === 'online').length,
			warning: services.filter((s) => s.status === 'warning').length,
			offline: services.filter((s) => s.status === 'offline').length,
			total: services.length,
		}),
		[services]
	);

	// Retorno memoizado del hook para evitar recreaciones de objetos
	return useMemo(
		() => ({
			isLoading,
			isInitialLoading,
			features,
			issues,
			services,
			featuresByStatus,
			issuesByStatus,
			servicesByStatus,
			updateTimestamp,
			refreshData: () => fetchData(true),
		}),
		[
			isLoading,
			isInitialLoading,
			features,
			issues,
			services,
			featuresByStatus,
			issuesByStatus,
			servicesByStatus,
			updateTimestamp,
			fetchData,
		]
	);
}
