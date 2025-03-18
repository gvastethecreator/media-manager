# Guía de Integración de Tarjetas de Entidades

Este documento proporciona instrucciones para integrar correctamente los componentes de tarjetas de entidades en la aplicación, utilizando el nuevo sistema basado en `EntityCardWrapper`.

## Arquitectura

La arquitectura del sistema de tarjetas está organizada en varias capas:

```
BaseCard → EntityCardWrapper → Layouts específicos (TagCard, AlbumCard, etc.)
```

1. **BaseCard**: Componente base que implementa todos los efectos visuales.
2. **EntityCardWrapper**: Adaptador que facilita la integración de BaseCard con layouts específicos.
3. **Layouts específicos**: Implementaciones visuales para cada tipo de entidad.

## Uso de EntityCardWrapper

El componente `EntityCardWrapper` simplifica la integración con `BaseCard` y maneja:

- Adaptación de opciones según el tipo de entidad
- Manejo de tipos diferentes de configuraciones
- Implementación consistente de efectos visuales

### Ejemplo básico:

```tsx
import { EntityCardWrapper } from '@/components/features/entity-cards/base/entity-card-wrapper';
import { generateRarityConfig } from '@/components/features/entity-cards/base/card-adapter';

export function MyEntityCard({ entity, options, onClick }) {
	// Generar configuración de rareza
	const rarityConfig = generateRarityConfig(entity.rarity, entity.color);

	return (
		<EntityCardWrapper
			className="my-card-class"
			options={options}
			entityType="album" // Tipo de diseño: album, tag, character, etc.
			rarity={rarityConfig}
			onClick={onClick}
		>
			{/* Contenido específico de la tarjeta */}
			<div className="flex flex-col h-full p-3">
				<h3>{entity.name}</h3>
				<p>{entity.description}</p>
			</div>
		</EntityCardWrapper>
	);
}
```

## Opciones de Configuración

Cada tipo de entidad puede tener opciones visuales específicas por defecto. Puedes personalizar:

- Efectos 3D y animaciones
- Efectos holográficos
- Efectos de grano y líneas de escaneo
- Bordes animados y halos
- Configuración de rareza y textura

### Propiedades disponibles en EntityCardWrapper:

| Propiedad                 | Tipo                                            | Descripción                                   |
| ------------------------- | ----------------------------------------------- | --------------------------------------------- |
| `children`                | ReactNode                                       | Contenido de la tarjeta                       |
| `className`               | string                                          | Clases CSS adicionales                        |
| `options`                 | Partial<BaseCardOptions \| SettingsCardOptions> | Configuración visual                          |
| `entityType`              | CardDesignPreset                                | Tipo de entidad (album, tag, character, etc.) |
| `rarity`                  | RarityConfig                                    | Configuración de rareza                       |
| `texture`                 | TextureConfig                                   | Configuración de textura                      |
| `onClick`                 | function                                        | Manejador de clics                            |
| `onHoverStart`            | function                                        | Evento al iniciar hover                       |
| `onHoverEnd`              | function                                        | Evento al finalizar hover                     |
| `showVisualizationConfig` | boolean                                         | Mostrar botón de configuración                |
| `enableExplode`           | boolean                                         | Habilitar vista explotada                     |

## Funciones Auxiliares

### generateRarityConfig

Genera una configuración de rareza estándar basada en el nombre de rareza:

```tsx
import { generateRarityConfig } from '@/components/features/entity-cards/base/card-adapter';

// Uso básico
const rarityConfig = generateRarityConfig('legendary');

// Con color personalizado (se usa si no hay rareza)
const customRarity = generateRarityConfig(undefined, '#3b82f6');
```

### adaptOptionsForLayout

Adapta las opciones de configuración según el tipo de entidad:

```tsx
import { adaptOptionsForLayout } from '@/components/features/entity-cards/base/card-adapter';

const adaptedOptions = adaptOptionsForLayout(baseOptions, 'album');
```

## Mejores Prácticas

1. **Utiliza el wrapper**: Siempre usar `EntityCardWrapper` en lugar de `BaseCard` directamente.
2. **Mantén la consistencia**: Aplicar estilos consistentes en todos los layouts.
3. **Gestiona el estado local**: Cada tarjeta debería gestionar su propio estado de hover.
4. **Personaliza según la entidad**: Implementa cada layout con su estilo distintivo.
5. **Prueba efectos visuales**: Prueba cómo se ven todos los efectos en cada tipo de tarjeta.

## Solución de Problemas

### Problemas comunes:

- **Efectos no visibles**: Asegúrate de que las opciones estén correctamente configuradas.
- **Errores de tipo**: Verifica que estás pasando las opciones del tipo correcto.
- **Rendimiento lento**: Desactiva algunos efectos visuales para mejorar el rendimiento.

## Ejemplo Completo

Consulta el archivo `tag-card-layout.tsx` para ver un ejemplo completo de implementación.
