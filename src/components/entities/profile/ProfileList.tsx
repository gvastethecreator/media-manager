/**
 * @file Componente de lista de perfiles
 * @module components/entities/profile/ProfileList
 */

import { AnimatePresence, motion } from '@/components/ui/motion-shim';
import { useCallback } from 'react';
import { useProfileStore } from '@/store/entities/profile';
import type { ProfileExtended } from '@/types/entities/profile';
import { ProfileCard } from './ProfileCard';

export interface ProfileListProps {
	className?: string;
}

/**
 * Componente que muestra una lista de perfiles en formato grid
 */
export function ProfileList({ className }: ProfileListProps) {
	// Obtener el estado del store
	const { profiles, selectedProfileId, expandedProfileIds, viewConfig, setSelectedProfileId, toggleExpandedProfileId } =
		useProfileStore();

	// Handlers
	const handleSelect = useCallback(
		(profile: ProfileExtended) => {
			setSelectedProfileId(profile.id);
		},
		[setSelectedProfileId]
	);

	const handleExpand = useCallback(
		(profile: ProfileExtended) => {
			toggleExpandedProfileId(profile.id);
		},
		[toggleExpandedProfileId]
	);

	// Determinar el número de columnas según el modo de vista
	const gridCols =
		viewConfig.mode === 'grid'
			? `grid-cols-1 sm:grid-cols-2 md:grid-cols-${viewConfig.gridColumns} lg:grid-cols-${viewConfig.gridColumns + 1}`
			: 'grid-cols-1';

	return (
		<div className={className}>
			<motion.div className={`grid ${gridCols} gap-4`}>
				<AnimatePresence>
					{profiles.map((profile) => (
						<ProfileCard
							isExpanded={expandedProfileIds.includes(profile.id)}
							isSelected={profile.id === selectedProfileId}
							key={profile.id}
							onExpand={handleExpand}
							onSelect={handleSelect}
							profile={profile}
						/>
					))}
				</AnimatePresence>
			</motion.div>

			{profiles.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12">
					<p className="font-medium text-lg text-muted-foreground">No hay perfiles para mostrar</p>
					<p className="mt-2 text-muted-foreground text-sm">Crea un nuevo perfil para empezar</p>
				</div>
			)}
		</div>
	);
}
