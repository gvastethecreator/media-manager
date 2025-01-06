# ⌛ Loading Screen

## 📝 Descripción

El componente `LoadingScreen` es una pantalla de carga que proporciona feedback visual durante operaciones asíncronas o transiciones. Muestra un indicador de carga animado y un mensaje personalizable.

## 🔧 Características Principales

- Animación suave de entrada/salida
- Mensaje personalizable
- Indicador de carga animado
- Diseño centrado y responsive

## 🏗️ Estructura

### Interfaces

```typescript
interface LoadingScreenProps {
	message?: string;
}
```

### Composición

```typescript
export function LoadingScreen({ message = "Cargando..." }: LoadingScreenProps) {
	return (
		<motion.div
			animate={{ opacity: [0, 1] }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 flex flex-col items-center justify-center w-full h-full"
		>
			<CircleDashed className="w-10 h-10 text-primary animate-spin text-white/70" />
			<p className="text-xs text-white/70 p-2">{message}</p>
		</motion.div>
	);
}
```

## 🔄 Ciclo de Vida

1. **Montaje**

   - Animación de entrada
   - Inicio de animación de carga
   - Mostrar mensaje

2. **Desmontaje**
   - Animación de salida
   - Limpieza de recursos
   - Transición suave

## 🎨 Componentes UI

### Principales

- `motion.div`: Contenedor animado
- `CircleDashed`: Icono de carga
- `Text`: Mensaje de carga

### Estilos

- Posicionamiento fijo
- Centrado absoluto
- Opacidad animada
- Colores del tema

## 🔍 Consideraciones

### Rendimiento

- Animaciones optimizadas
- Gestión de memoria
- Transiciones eficientes
- Minimización de re-renders

### UX/UI

- Feedback visual claro
- Mensajes informativos
- Consistencia visual
- Adaptación responsive

### Accesibilidad

- Roles ARIA apropiados
- Estados de carga
- Mensajes descriptivos
- Contraste adecuado

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<LoadingScreen />

// Con mensaje personalizado
<LoadingScreen message="Procesando imágenes..." />

// En un contenedor específico
<div className="relative">
  {isLoading && <LoadingScreen message="Cargando contenido..." />}
  {children}
</div>
```

## 🔗 Dependencias

- `motion/react`: Animaciones
- `lucide-react`: Iconos
- `@/lib/utils`: Utilidades

## 📝 Notas Técnicas

### Optimizaciones

- Animaciones eficientes
- Gestión de estado
- Transiciones suaves
- Limpieza de recursos

### Integración

- Sistema de temas
- Gestión de estado
- Eventos del sistema
- Animaciones globales

### Mantenibilidad

- Componente reutilizable
- Props tipadas
- Documentación clara
- Tests unitarios

### Personalización

- Mensajes adaptables
- Temas personalizables
- Animaciones configurables
- Estilos extensibles

### Mejores Prácticas

- Uso de motion.div para animaciones
- Mensajes claros y concisos
- Feedback visual inmediato
- Transiciones suaves

```

```
