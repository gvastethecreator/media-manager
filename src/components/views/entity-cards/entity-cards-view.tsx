import { memo } from 'react';
import { useNavigationData } from '@/hooks/useNavigationData';

export const EntityCardsView = memo(function EntityCardsView() {
	const { data, isLoading, isError, error } = useNavigationData();

	if (isLoading) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center p-6">
				<p className="text-muted-foreground">Cargando datos de entidades...</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center p-6">
				<p className="text-red-500">Error al cargar los datos: {error.message}</p>
			</div>
		);
	}

	return (
		<div className="h-full w-full flex flex-col p-6">
			<h2 className="text-2xl font-bold mb-4">🃏 Entity Cards</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{data?.folders && (
					<div className="bg-card p-4 rounded-lg shadow">
						<h3 className="font-bold">Carpetas</h3>
						<p>{data.folders.length} carpetas</p>
					</div>
				)}
				{data?.collections && (
					<div className="bg-card p-4 rounded-lg shadow">
						<h3 className="font-bold">Colecciones</h3>
						<p>{data.collections.length} colecciones</p>
					</div>
				)}
				{data?.tags && (
					<div className="bg-card p-4 rounded-lg shadow">
						<h3 className="font-bold">Etiquetas</h3>
						<p>{data.tags.length} etiquetas</p>
					</div>
				)}
			</div>
		</div>
	);
});
