import { memo } from 'react';
import Silk from '@/components/ui/silk-background';
import type { SystemStats } from '@/hooks/useSystemStats';

interface DashboardContentViewProps {
	stats: SystemStats | undefined;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
}

const DashboardContentView: React.FC<DashboardContentViewProps> = memo(function DashboardContentView({
	stats,
	isLoading,
	isError,
	error,
}) {
	if (isLoading) {
		return (
			<div className="relative h-full w-full">
				{/* Silk Background */}
				<div className="absolute inset-0 z-0">
					<Silk speed={3} scale={1.2} color="#7B7481" noiseIntensity={1.2} rotation={0.1} />
				</div>

				{/* Content overlay */}
				<div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-6">
					<p className="text-white/80 drop-shadow-md">Cargando estadísticas...</p>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="relative h-full w-full">
				{/* Silk Background */}
				<div className="absolute inset-0 z-0">
					<Silk speed={3} scale={1.2} color="#7B7481" noiseIntensity={1.2} rotation={0.1} />
				</div>

				{/* Content overlay */}
				<div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-6">
					<p className="text-red-400 drop-shadow-md">Error al cargar las estadísticas: {error?.message}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-full w-full">
			{/* Silk Background */}
			<div className="absolute inset-0 z-0">
				<Silk speed={3} scale={1.2} color="#7B7481" noiseIntensity={1.2} rotation={0.1} />
			</div>

			{/* Content overlay */}
			<div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-6">
				<h2 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">🏠 Dashboard</h2>
				<p className="text-white/80 drop-shadow-md">Bienvenido al panel de control.</p>
				<div className="grid grid-cols-2 gap-4 mt-8">
					<div className="bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/20">
						<p className="text-sm text-muted-foreground">Imágenes</p>
						<p className="text-2xl font-bold">{stats?.totalImages}</p>
					</div>
					<div className="bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/20">
						<p className="text-sm text-muted-foreground">Carpetas</p>
						<p className="text-2xl font-bold">{stats?.totalFolders}</p>
					</div>
					<div className="bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/20">
						<p className="text-sm text-muted-foreground">Colecciones</p>
						<p className="text-2xl font-bold">{stats?.totalCollections}</p>
					</div>
					<div className="bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/20">
						<p className="text-sm text-muted-foreground">Etiquetas</p>
						<p className="text-2xl font-bold">{stats?.totalTags}</p>
					</div>
				</div>
			</div>
		</div>
	);
});

export default DashboardContentView;
