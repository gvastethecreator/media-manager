# Módulo de Rendimiento para Entity Cards

## 📋 Descripción

El módulo de rendimiento proporciona configuraciones y optimizaciones para mejorar el rendimiento de las Entity Cards. Permite configurar estrategias de carga, optimización de imágenes, virtualización y opciones de animación.

## 🧩 Componentes

- `PerformanceModule`: Componente principal que muestra las opciones de configuración de rendimiento.

## 🪝 Hooks

- `usePerformance`: Hook para gestionar el estado y la lógica de las opciones de rendimiento.

## 🧪 Uso

```tsx
import { PerformanceModule } from '@/components/features/entity-cards/modules/performance';

function MyComponent() {
	const handleChange = (options) => {
		console.log('Opciones actualizadas:', options);
	};

	return (
		<PerformanceModule
			initialOptions={{
				performanceMode: 'balanced',
				enableCache: true,
			}}
			onChange={handleChange}
		/>
	);
}
```

## 🔧 Opciones de Configuración

### Estrategia de Carga

- `loadingStrategy`: Define cómo se cargan los recursos (eager, lazy, progressive)
- `enablePreloading`: Habilita la precarga de recursos
- `lazyLoad`: Carga las imágenes solo cuando están a punto de ser visibles
- `prefetch`: Precarga las imágenes para una navegación más fluida
- `imageOptimization`: Optimiza automáticamente las imágenes
- `prefetchOnHover`: Precarga recursos al pasar el cursor sobre la tarjeta

### Virtualización y Caché

- `performanceMode`: Balance entre rendimiento y calidad visual
- `enableCache`: Habilita el uso de caché
- `virtualizeList`: Renderiza solo las tarjetas visibles en la ventana
- `cacheStrategy`: Método para almacenar datos en caché
- `enableHardwareAcceleration`: Utiliza la GPU para renderizado
- `useWASM`: Utiliza WebAssembly para operaciones intensivas
- `batchUpdates`: Agrupa actualizaciones para mejorar el rendimiento
- `throttleMs`: Milisegundos entre actualizaciones

### Animaciones

- `reducedMotion`: Reduce o elimina las animaciones
- `useRAF`: Utiliza requestAnimationFrame para las animaciones
- `animationDuration`: Duración de las animaciones
- `animationMaxFPS`: Frames por segundo máximos para animaciones

## 🔄 Integración

Este módulo está diseñado para integrarse con el sistema de Entity Cards, proporcionando una manera sencilla de configurar opciones de rendimiento para tarjetas de entidad.
