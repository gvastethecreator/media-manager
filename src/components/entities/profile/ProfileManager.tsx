/**
 * @file Componente principal de gestión de perfiles
 * @module components/entities/profile/ProfileManager
 */

'use client';

import { useProfileStore } from '@/store/entities/profile';
import { useEffect } from 'react';
import { ProfileControls } from './ProfileControls';
import { ProfileList } from './ProfileList';

export interface ProfileManagerProps {
	className?: string;
}

/**
 * Componente principal que gestiona la visualización y gestión de perfiles
 */
export function ProfileManager({ className }: ProfileManagerProps) {
	// Obtener el estado y acciones del store
	const { fetchProfiles, isLoadingProfiles, profilesError } = useProfileStore();

	// Cargar perfiles al montar el componente
	useEffect(() => {
		fetchProfiles();
	}, [fetchProfiles]);

	return (
		<div className={className}>
			{/* Controles */}
			<ProfileControls className="mb-6" />

			{/* Estado de carga */}
			{isLoadingProfiles && (
				<div className="flex items-center justify-center py-12">
					<div className="flex flex-col items-center gap-4">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						<p className="text-sm text-muted-foreground">Cargando perfiles...</p>
					</div>
				</div>
			)}

			{/* Error */}
			{profilesError && (
				<div className="flex items-center justify-center py-12">
					<div className="flex flex-col items-center gap-4">
						<div className="rounded-full bg-destructive/10 p-3 text-destructive">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-label="Error al cargar perfiles"
								role="img"
							>
								<title>Error al cargar perfiles</title>
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="12" />
								<line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
						</div>
						<div className="text-center">
							<p className="font-medium">Error al cargar los perfiles</p>
							<p className="text-sm text-muted-foreground mt-1">{profilesError}</p>
						</div>
					</div>
				</div>
			)}

			{/* Lista de perfiles */}
			{!isLoadingProfiles && !profilesError && <ProfileList />}
		</div>
	);
}
