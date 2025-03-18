# Análisis de la Gestión de Estado

## Estado Actual

La aplicación utiliza múltiples enfoques para la gestión de estado:

1. **Zustand**: Principal manejador de estado global
2. **React Query**: Para la gestión de datos del servidor y caché
3. **Context API**: Para algunos contextos específicos
4. **Server Components y Server Actions**: Para estado en el servidor

## Patrón de Implementación de Zustand

Los stores Zustand siguen un enfoque estructurado pero con algunas inconsistencias:

```typescript
// Patrón común:
export const useImageStore = create<ImageState>((set, get) => ({
	// estado...
	acciones: () => {
		// lógica que modifica el estado
		set((state) => ({ ...state /* cambios */ }));
	},
}));

// Algunos stores utilizan el middleware persist:
export const useSettingsStore = create<SettingsState>()(
	persist(
		(set, get) => ({
			// configuración y acciones...
		}),
		{ name: 'settings-storage' }
	)
);

// Otros stores utilizan un patrón factory:
export const useProfileStore = createStoreFactory<Profile, ProfileState>('profile', {
	// estado extendido específico...
});
```

## Análisis de React Query

La configuración actual de React Query:

```typescript
// Configuración básica en src/lib/react-query.ts
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minuto
			gcTime: 1000 * 60 * 5, // 5 minutos
			retry: 2,
		},
	},
});
```

Los hooks para datos están implementados de manera inconsistente:

- Algunos utilizan clave de consulta estructurada
- Otros utilizan gestión personalizada de la caché
- La invalidación de cache no sigue un patrón consistente

## Problemas Identificados

1. **Fragmentación del Estado**:

   - Estado dividido entre múltiples stores sin una clara separación de responsabilidades
   - Duplicación de lógica entre stores diferentes
   - Inconsistencia en el manejo de errores y estados de carga

2. **React Query Subutilizado**:

   - No se aprovechan características avanzadas como queryClient.prefetchQuery
   - Configuración estática sin optimizaciones por tipo de datos
   - Falta de estrategias para datos relacionados (invalidación en cascada)

3. **Persistencia Inconsistente**:

   - Algunos stores utilizan middleware persist, otros no
   - Falta de estrategia clara para datos que deben o no persistir
   - Potenciales problemas de sincronización entre estado persistido y datos del servidor

4. **Integración con Server Components**:
   - No hay un patrón claro para la comunicación entre Server Components y Client Components
   - Revalidación de rutas en algunos casos pero no en otros
   - Desconexión entre Server Actions y actualización del estado cliente

## Recomendaciones

### 1. Estandarización de Stores Zustand

Implementar un patrón consistente para todos los stores:

```typescript
// Patrón recomendado para stores Zustand
export const createEntityStore = <T extends BaseEntity>(entityName: string) =>
	create<EntityStore<T>>()(
		persist(
			(set, get) => ({
				// Estado base común
				items: [],
				isLoading: false,
				error: null,

				// Acciones estándar (CRUD)
				fetch: async () => {
					/* implementación */
				},
				add: async (item) => {
					/* implementación */
				},
				update: async (id, item) => {
					/* implementación */
				},
				remove: async (id) => {
					/* implementación */
				},

				// Estado específico de la entidad...
			}),
			{
				name: `${entityName}-store`,
				partialize: (state) => ({ items: state.items }),
			}
		)
	);
```

### 2. Optimización de React Query

```typescript
// Configuración mejorada
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: (query) => {
				// Ajustar staleTime según el tipo de datos
				if (query.queryKey[0] === 'stats') return 1000 * 30; // 30s para estadísticas
				if (query.queryKey[0] === 'settings') return 1000 * 60 * 60; // 1h para configuraciones
				return 1000 * 60; // 1min por defecto
			},
			retry: (failureCount, error) => {
				if (error instanceof NetworkError) return failureCount < 3;
				return failureCount < 1;
			},
			refetchOnWindowFocus: (query) => {
				// Solo refrescar datos dinámicos al enfocar
				return ['stats', 'notifications'].includes(query.queryKey[0] as string);
			},
		},
	},
});
```

### 3. Integración con Server Components

Establecer un patrón claro para la comunicación:

1. **Estado Derivado del Servidor**:

   - Datos obtenidos en Server Components pasados a Client Components
   - Uso de React Query para refrescar datos cuando sea necesario
   - Preferencia por RSC para datos iniciales

2. **Server Actions Optimistas**:
   - Actualización optimista del estado cliente al invocar Server Actions
   - Revalidación de datos tras completar acciones del servidor
   - Sistema centralizado para gestionar errores

```typescript
// Ejemplo de integración Server Action + Cliente
'use client'

function PostEditor({ postId, initialData }) {
  const queryClient = useQueryClient();

  const updatePost = async (data) => {
    // 1. Actualización optimista del estado
    queryClient.setQueryData(['post', postId], (old) => ({ ...old, ...data }));

    try {
      // 2. Llamada a Server Action
      await updatePostAction(postId, data);

      // 3. Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post actualizado');
    } catch (error) {
      // 4. Revertir en caso de error
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast.error('Error al actualizar');
    }
  };

  return (/* UI del componente */);
}
```

### 4. Separación de Estado UI vs Estado de Datos

Dividir claramente la responsabilidad:

- **Estado UI**: Preferentemente en Zustand (modal abierto/cerrado, selecciones, etc.)
- **Estado de Datos**: Preferentemente en React Query (datos del servidor con caché)
- **Estado de Formularios**: React Hook Form
- **Estado de Componentes**: React useState/useReducer

## Plan de Implementación

1. **Fase 1: Estandarización**

   - Refactorizar stores para seguir un patrón consistente
   - Definir claves de consulta estándar para React Query
   - Documentar patrones aprobados para gestión de estado

2. **Fase 2: Optimización**

   - Implementar configuración avanzada de React Query
   - Introducir prefetching para mejorar experiencia de usuario
   - Optimizar flujos de revalidación de datos

3. **Fase 3: Integración Server/Cliente**
   - Establecer patrón claro para comunicación entre Server y Client Components
   - Mejorar sistema de revalidación
   - Implementar manejo de errores unificado

## Conclusión

La gestión de estado actual funciona pero podría beneficiarse significativamente de una estandarización y optimización. Un enfoque más estructurado y consistente mejoraría la mantenibilidad y el rendimiento de la aplicación.

Refactorizar los stores Zustand para seguir un patrón común y aprovechar mejor las capacidades de React Query tendría un impacto positivo inmediato en la calidad del código y la experiencia del usuario.
