import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemeMode } from '@/types/entities/profile';

const API_BASE = '/api/profiles';

// Hook para obtener el perfil activo
export const useActiveProfile = () => {
	return useQuery({
		queryKey: ['activeProfile'],
		queryFn: async () => {
			const response = await fetch(`${API_BASE}/active`);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const result = await response.json();
			return result.data;
		},
	});
};

// Hook para actualizar el tema (con actualización optimista)
export const useUpdateTheme = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (theme: ThemeMode) => {
			const response = await fetch(`${API_BASE}/active/theme`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ theme }),
			});

			if (!response.ok) {
				throw new Error('Failed to update theme');
			}

			return response.json();
		},
		onMutate: async (newTheme: ThemeMode) => {
			// Cancelar cualquier refetch pendiente para evitar sobreescribir la actualización optimista
			await queryClient.cancelQueries({ queryKey: ['activeProfile'] });

			// Guardar el estado previo
			const previousProfile = queryClient.getQueryData(['activeProfile']);

			// Actualizar el estado de forma optimista
			queryClient.setQueryData(['activeProfile'], (old: any) => {
				if (!old) return null;
				return { ...old, theme: newTheme };
			});

			// Devolver el estado previo en el contexto para poder hacer rollback
			return { previousProfile };
		},
		onError: (err, newTheme, context) => {
			// Revertir al estado previo en caso de error
			if (context?.previousProfile) {
				queryClient.setQueryData(['activeProfile'], context.previousProfile);
			}
		},
		onSettled: () => {
			// Invalidar y refetchear la query del perfil activo para asegurar consistencia
			queryClient.invalidateQueries({ queryKey: ['activeProfile'] });
		},
	});
};
