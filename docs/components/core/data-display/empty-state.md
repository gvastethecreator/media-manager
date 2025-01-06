# 🗑️ Empty State

## 📝 Descripción

El componente `EmptyState` es un componente de presentación que se muestra cuando no hay datos disponibles o cuando una lista o contenedor está vacío. Proporciona feedback visual al usuario con un icono, título y descripción personalizables.

## 🔧 Características Principales

- Diseño centrado y responsive
- Animaciones suaves de entrada
- Iconografía personalizable
- Mensajes informativos claros

## 🏗️ Estructura

### Interfaces

```typescript
interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	className?: string;
}
```

### Composición

```typescript
export function EmptyState({
	icon: Icon,
	title,
	description,
	className,
}: EmptyStateProps) {
	return (
		<motion.div
			animate={{ opacity: [0, 1], y: [20, 0] }}
			className={cn(
				"flex flex-col items-center justify-center h-full w-full text-muted-foreground",
				className
			)}
		>
			<BlurFade
				className="text-center flex flex-col items-center justify-center"
				delay={0.5}
				inView={true}
			>
				<Icon className="w-12 h-12 mb-4 opacity-50" />
				<h3 className="text-lg font-medium mb-2">{title}</h3>
				<p className="text-sm text-muted-foreground">{description}</p>
			</BlurFade>
		</motion.div>
	);
}
```

## 🔄 Ciclo de Vida

1. **Montaje**

   - Animación de entrada
   - Renderizado de icono
   - Mostrar contenido

2. **Actualización**
   - Transiciones suaves
   - Actualización de mensajes
   - Gestión de clases

## 🎨 Componentes UI

### Principales

- `motion.div`: Contenedor animado
- `BlurFade`: Efecto de desvanecimiento
- `Icon`: Icono personalizable
- `Text`: Elementos de texto

### Estilos

- Centrado vertical y horizontal
- Opacidad y escala animadas
- Colores del tema
- Espaciado consistente

## 🔍 Consideraciones

### Rendimiento

- Animaciones optimizadas
- Lazy loading de iconos
- Gestión eficiente de estado
- Minimización de re-renders

### UX/UI

- Feedback visual claro
- Mensajes informativos
- Consistencia visual
- Adaptación responsive

### Accesibilidad

- Textos alternativos
- Contraste adecuado
- Roles semánticos
- Navegación por teclado

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<EmptyState
  icon={FolderOpen}
  title="No hay archivos"
  description="Esta carpeta está vacía"
/>

// Con clase personalizada
<EmptyState
  icon={Search}
  title="Sin resultados"
  description="No se encontraron coincidencias"
  className="min-h-[400px]"
/>

// En un contenedor
<div className="h-full">
  {items.length === 0 && (
    <EmptyState
      icon={ImageIcon}
      title="No hay imágenes"
      description="Agrega algunas imágenes para empezar"
    />
  )}
</div>
```

## 🔗 Dependencias

- `motion/react`: Animaciones
- `lucide-react`: Iconos
- `@/components/ui/blur-fade`: Efecto de desvanecimiento
- `@/lib/utils`: Utilidades

## 📝 Notas Técnicas

### Optimizaciones

- Memorización de componentes
- Lazy loading de iconos
- Animaciones eficientes
- Gestión de clases

### Integración

- Sistema de temas
- Iconografía global
- Gestión de estado
- Animaciones del sistema

### Mantenibilidad

- Componente reutilizable
- Props tipadas
- Documentación clara
- Tests unitarios

### Personalización

- Temas personalizables
- Iconos intercambiables
- Mensajes adaptables
- Estilos extensibles
