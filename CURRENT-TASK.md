# Corrección de Transformers

## Análisis de Errores

Tras analizar los transformers, hemos identificado los siguientes problemas:

1. **Importaciones obsoletas**:
   - Uso de `import { Logger } from '@/lib/logger'` cuando debemos usar `import { serverLogger } from '@/lib/logger/server-logger'`
   - Instanciación de `PrismaClient` en cada archivo en lugar de importar la instancia singleton de `@/lib/prisma`

2. **Estructura de clases estáticas**:
   - Los transformers están implementados como clases estáticas, lo que dificulta el testing y la modularidad
   - Este patrón está obsoleto y debe ser reemplazado por funciones independientes con un objeto de compatibilidad

3. **Desalineación con el schema de Prisma**:
   - Algunas propiedades en los transformers no coinciden con las definidas en el schema.prisma
   - Campos como `name` en vez de `title`, `isFavorite` en vez de `favorite`, etc.

4. **Problemas de tipado**:
   - Uso incorrecto de tipos en los mappers, especialmente en las relaciones
   - Falta de tipado adecuado para las funciones de mapeo

5. **Manejo de errores ineficiente**:
   - Captura de errores redundante en algunos métodos
   - Falta de logging detallado en algunos casos

6. **Funciones duplicadas con nombres idénticos**:
   - Algunas funciones están definidas dos veces con el mismo nombre pero diferentes firmas
   - Esto causa errores de linter y confusión en el código

## Plan de Corrección

Hemos establecido los siguientes pasos para corregir estos problemas:

1. **Actualizar importaciones**:
   - Reemplazar `Logger` por `serverLogger`
   - Importar la instancia de `prisma` desde `@/lib/prisma`

2. **Refactorizar estructura**:
   - Transformar las clases estáticas en funciones individuales exportadas
   - Crear un objeto de compatibilidad para mantener la API pública actual
   - Documentar la depreciación de las clases estáticas

3. **Alinear con el schema de Prisma**:
   - Verificar y corregir los nombres de campos para que coincidan con schema.prisma
   - Ajustar los mappers para trabajar con los campos correctos

4. **Mejorar tipado**:
   - Definir tipos explícitos para todas las funciones de mapeo
   - Utilizar `Prisma.XxxCreateInput` y `Prisma.XxxUpdateInput` para los tipos de retorno

5. **Optimizar manejo de errores**:
   - Implementar logging consistente en todos los transformers
   - Eliminar captura de errores redundante

6. **Resolver nombres de funciones duplicados**:
   - Renombrar funciones duplicadas con nombres más descriptivos
   - Asegurar que las referencias se actualicen en todo el código

## Progreso

### Completado ✅

- **Album Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Refactorización de clase a funciones
  - ✅ Creación de objeto de compatibilidad
  - ✅ Corrección de mappers y serializers
  - ✅ Mejora de tipado

- **Image Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Refactorización de clase a funciones
  - ✅ Creación de objeto de compatibilidad
  - ✅ Corrección de mappers y serializers
  - ✅ Mejora de tipado

- **Collection Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Refactorización de clase a funciones
  - ✅ Creación de objeto de compatibilidad
  - ✅ Corrección de mappers y serializers
  - ✅ Mejora de tipado
  - ✅ Resolución de funciones duplicadas

- **Concept Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Refactorización de mappers.ts
  - ✅ Refactorización de serializers.ts
  - ✅ Reemplazo del uso de delete operator
  - ✅ Mejora de tipado en funciones
  - ✅ Mejora de documentación

- **Character Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Reemplazo del uso de delete operator
  - ✅ Mejora de estructura en el método toPrismaCharacter
  - ✅ Mejora de estructura en el método fromExtendedCharacter
  - ✅ Corrección de tipado en toExtendedCharacter
  - ✅ Mejora de mappers.ts

- **Group Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Refactorización de la clase a funciones
  - ✅ Corrección de propiedades isFavorite a favorite
  - ✅ Mejora del manejo de errores
  - ✅ Implementación de nuevo objeto de compatibilidad
  - ✅ Mejora de la documentación
  - ✅ Reemplazo del archivo principal de exportación

- **Note Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Refactorización de mappers.ts
  - ✅ Refactorización de serializers.ts
  - ✅ Reemplazo del uso de delete operator por filtrado positivo
  - ✅ Mejora del manejo de errores con TransformerError
  - ✅ Corrección de propiedades isFavorite/favorite
  - ✅ Implementación de nuevo objeto de compatibilidad
  - ✅ Creación del archivo principal de exportación

- **Place Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Reemplazo de Logger por serverLogger
  - ✅ Importación de instancia singleton de prisma
  - ✅ Corrección de propiedades isFavorite/favorite
  - ✅ Reemplazo del uso de delete operator
  - ✅ Mejora del manejo de errores
  - ✅ Implementación de nuevo objeto de compatibilidad
  - ✅ Mejora de la documentación

- **Prompt Transformer**:
  - ✅ Actualización de importaciones
  - ✅ Creación de estructura v2
  - ✅ Corrección de propiedades isFavorite/favorite
  - ✅ Refactorización de funciones
  - ✅ Mejora del manejo de errores con TransformerError
  - ✅ Implementación de nuevo objeto de compatibilidad
  - ✅ Tipado correcto con Prisma.PromptCreateInput y Prisma.PromptUpdateInput
  - ✅ Creación del archivo principal de exportación

### En Progreso 🔄

Transformers pendientes de corregir, siguiendo el mismo patrón:

- Property
- Tag
- Video
- Wildcard
- WorldItem

## Próximos Pasos

1. Continuar con la corrección del siguiente transformer: **Property**
   - Seguir el mismo patrón utilizado en los transformers ya corregidos
   - Verificar consistencia en los nombres de campos con schema.prisma
   - Asegurar tipado correcto en todas las funciones

2. Después de corregir todos los transformers, crear tests unitarios para verificar el funcionamiento

3. Considerar la creación de un script automatizado para detectar problemas similares en el futuro

## Notas Adicionales

- La estructura de carpetas actual es adecuada y se mantendrá
- Las correcciones deben ser no disruptivas para mantener la compatibilidad con el código existente
- Las nuevas funciones siguen la convención de nombres: verbos en infinitivo (p.ej., `searchNotes`, `getNoteById`)
- El objeto de compatibilidad mantiene los nombres originales para facilitar la migración
- Para funciones duplicadas, se usa un sufijo más descriptivo (p.ej., `parseCollectionFiltersFromString`)
