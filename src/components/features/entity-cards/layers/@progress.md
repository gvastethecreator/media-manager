# Plan de acción para integración de capas con módulos

## Análisis del sistema actual

### Estructura
- `src/components/features/entity-cards/layers/`: Implementación de capas individuales y sistema de plugins
- `src/components/features/entity-cards/modules/layers-module/`: Módulo que integra las capas en el sistema de tarjetas
- `src/components/features/entity-cards/settings/`: Configuración y UI para gestionar las capas
- `src/components/features/entity-cards/modules/preview/`: Visualización en tiempo real de las capas

### Problemas identificados
1. **Inconsistencia en registros de capas**:
   - Múltiples componentes de registro (`RegisterLayers`, `RegisterLayersV2`, `RegisterAllLayers`)
   - Falta de coherencia en cómo las capas se registran y utilizan

2. **Integración incompleta entre sistemas**:
   - Sistema de plugins (`LayerPluginProvider`) y sistema del módulo (`LayersProvider`) no están bien conectados
   - Problemas de tipo en adaptadores (`preview-settings-adapter.tsx`)

3. **Visualización incompleta en tiempo real**:
   - La vista previa no refleja correctamente los cambios en todas las capas
   - Falta de funcionalidad para visualizar capas específicas

4. **Problemas de tipo en implementaciones de capas**:
   - Incompatibilidades entre interfaces de capa y componentes concretos
   - Falta de tipos consistentes entre los sistemas (`LayerConfig` vs tipos específicos)

## Tareas a realizar

### 1. Unificación de sistemas de registro de capas (Prioridad: ALTA)
- [x] Revisar todos los componentes de registro (`RegisterLayers`, `RegisterLayersV2`, `RegisterAllLayers`)
- [x] Implementar un único punto de registro coherente
- [x] Actualizar referencias en todo el código para usar el sistema unificado
- [x] Asegurar que todas las capas se registren correctamente independientemente del sistema

### 2. Mejora de adaptadores entre sistemas (Prioridad: ALTA)
- [x] Corregir errores de tipo en `preview-settings-adapter.tsx`
- [x] Mejorar `adaptEntityCardToLayerSystem` y `adaptLayerSystemToEntityCard` para manejar todos los casos
- [x] Implementar una integración bidireccional completa entre ambos sistemas
- [ ] Probar exhaustivamente la integración con diferentes configuraciones

### 3. Optimización de implementaciones de capa (Prioridad: MEDIA)
- [x] Revisar cada implementación de capa individual (`border`, `glow`, etc.)
- [x] Asegurar que todas implementen la interfaz `LayerImplementation` correctamente
- [x] Completar implementaciones faltantes o parciales para `border`, `animated-border` y `chromatic-aberration`
- [x] Documentar las capas implementadas según un estándar unificado
- [ ] Completar implementaciones para las demás capas

### 4. Mejora de visualización en tiempo real (Prioridad: ALTA)
- [x] Modificar `preview-module.tsx` para mostrar todas las capas correctamente
- [x] Añadir capacidad para visualizar capas individualmente
- [x] Implementar transiciones suaves para cambios de configuración
- [x] Asegurar que la vista explotada funcione para todas las capas

### 5. Integración con panel de configuración (Prioridad: MEDIA)
- [x] Revisar `entities-cards-settings.tsx` para correcta integración con capas
- [ ] Modificar `LayersPanel` para manejar todas las capas disponibles
- [x] Asegurar que los cambios se reflejen inmediatamente en la vista previa
- [ ] Implementar UI mejorada para selección y configuración de capas

### 6. Pruebas e integración final (Prioridad: BAJA)
- [ ] Probar integración completa con diferentes tipos de entidades
- [ ] Verificar rendimiento con múltiples capas activas
- [ ] Documentar el sistema finalizado
- [ ] Crear ejemplos de uso y guías para añadir nuevas capas

## Estado por archivos

### Archivos ya corregidos
- ✅ `src/components/features/entity-cards/modules/preview/preview-settings-adapter.tsx`
- ✅ `src/components/features/entity-cards/layers/index.ts`
- ✅ `src/components/features/entity-cards/modules/layers-module/register-layers.tsx`
- ✅ `src/components/features/entity-cards/modules/preview/preview-module.tsx`
- ✅ `src/components/features/entity-cards/settings/entities-cards-settings.tsx` (importaciones)
- ✅ `src/components/features/entity-cards/layers/border/border-settings.tsx` (adaptada para nuevo sistema)
- ✅ `src/components/features/entity-cards/layers/border/border-layer-implementation.tsx` (implementación completa)
- ✅ `src/components/features/entity-cards/layers/border/border-effect-layer.tsx` (corregido tipo y parámetros)
- ✅ `src/components/features/entity-cards/layers/border/index.ts` (actualizadas exportaciones)
- ✅ `src/components/features/entity-cards/layers/animated-border/animated-border-settings.tsx` (adaptada para nuevo sistema)
- ✅ `src/components/features/entity-cards/layers/animated-border/animated-border-effect-layer.tsx` (corregido tipo y parámetros)
- ✅ `src/components/features/entity-cards/layers/animated-border/index.tsx` (implementación completa)
- ✅ `src/components/features/entity-cards/layers/animated-border/actions/animated-border-config.action.ts` (implementación básica)
- ✅ `src/components/features/entity-cards/layers/animated-border/actions/index.ts` (exportaciones)
- ✅ `src/components/features/entity-cards/layers/chromatic-aberration/chromatic-aberration-effect-layer.tsx` (corregido tipo y parámetros)
- ✅ `src/components/features/entity-cards/layers/chromatic-aberration/chromatic-aberration-settings.tsx` (adaptada para nuevo sistema)
- ✅ `src/components/features/entity-cards/layers/chromatic-aberration/index.tsx` (implementación completa)
- ✅ `src/components/features/entity-cards/layers/chromatic-aberration/index.ts` (actualizadas exportaciones)
- ✅ `src/components/features/entity-cards/layers/chromatic-aberration/actions/index.ts` (exportaciones)

### Archivos con problemas pendientes
- [ ] `src/components/features/entity-cards/layers/register-layers-v2.tsx`
- [ ] `src/components/features/entity-cards/layers/register-layers.tsx`
- [ ] `src/components/features/entity-cards/modules/layers-module/use-layers.tsx`
- [ ] `src/components/features/entity-cards/modules/layers-module/entity-card-layer-adapter.ts` (revisar edge cases)
- [ ] Implementaciones individuales de otras capas (glow, scanlines, etc.)
- [ ] `src/components/features/entity-cards/layers/layer-plugin-system.tsx` (optimizar)

## Progreso actual

### Capas implementadas (✅) y pendientes (⚠️)
✅ `border`: Capa de borde estándar
✅ `animated-border`: Capa de borde con efectos de animación
✅ `chromatic-aberration`: Capa de aberración cromática
⚠️ `glow`: Capa de resplandor
⚠️ `holographic`: Capa de efecto holográfico
⚠️ `content`: Capa de contenido principal
⚠️ `metadata`: Capa para información y metadatos
⚠️ `image`: Capa para imágenes
⚠️ `texture`: Capa de textura
⚠️ `scanlines`: Capa de líneas de escaneo

### Mejoras completadas
✅ Corrección de errores de tipo en `preview-settings-adapter.tsx`
✅ Actualización de exportaciones en `layers/index.ts`
✅ Mejora de importaciones en `entities-cards-settings.tsx`
✅ Implementación de un sistema de registro unificado en `register-layers.tsx`
✅ Mejora de la visualización de capas en `preview-module.tsx`
✅ Adaptación de componentes de configuración para trabajar con el nuevo sistema de capas
✅ Implementación de capas según la nueva interfaz `LayerImplementation`
✅ Actualización del registro de capas para incluir nuevas implementaciones
✅ Corrección de problemas de tipo en los componentes de efecto
✅ Implementación de funciones auxiliares para la transformación de capas en modo explotado
✅ Creación de acciones de servidor para las capas implementadas
✅ Eliminación de la propiedad `getServerActions` en `LayerImplementation` que causaba errores

### Problemas resueltos
✅ **Inconsistencia de tipos entre sistemas**: Se resolvió mediante adaptadores de tipo y el uso de `[key: string]: unknown` para compatibilidad con índices dinámicos.

✅ **Diferentes estructuras en componentes de capa**: Se han estandarizado los componentes de capas para que usen una estructura común basada en la interfaz `LayerImplementation`.

✅ **Interfaces parcialmente implementadas**: Se han completado las implementaciones de `border`, `animated-border` y `chromatic-aberration` para que cumplan con toda la interfaz requerida.

✅ **Problemas con globalThis**: Se ha reemplazado el uso de `globalThis` en los estilos CSS con un objeto de variables más seguro.

✅ **Funciones de transformación faltantes**: Se han implementado funciones auxiliares `getExplodeTransform` para manejar el modo explotado en las capas.

✅ **Errores con getServerActions**: Se eliminó esta propiedad de las implementaciones al no formar parte de la interfaz `LayerImplementation`.

### Próximos pasos
1. **Continuar con implementaciones de capa**: Implementar el resto de capas siguiendo el patrón establecido.
2. **Verificar registro de capas**: Confirmar que todas las capas implementadas se registran correctamente.
3. **Probar visualización**: Comprobar que las capas se muestran correctamente en el módulo de previsualización.
4. **Optimizar sistema de plugins**: Mejorar la eficiencia del sistema de plugins para evitar re-renderizados innecesarios.

## Notas adicionales
- Se ha establecido un patrón claro para la implementación de capas basado en los archivos de capas ya implementadas
- Las implementaciones incluyen una configuración por defecto bien tipada, función de renderizado compatible y componente de configuración adaptado
- Se ha mejorado la compatibilidad entre `LayerConfig` genérico y los tipos específicos de cada capa usando `[key: string]: unknown` e interfaces extendidas
- Todas las implementaciones siguen un estándar de documentación con comentarios explicativos
- Se ha simplificado el sistema de exportaciones en los archivos `index.ts` para facilitar el uso e importación de componentes
- Se han actualizado las referencias en el módulo de registro para incluir todas las capas implementadas