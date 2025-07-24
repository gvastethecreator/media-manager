# Reglas de Desarrollo del Proyecto Image Manager

## 1. Resumen del Proyecto

Este documento establece las reglas y metodologías de desarrollo para el proyecto Image Manager. Define un enfoque sistemático y autónomo para la resolución de problemas, corrección de errores y desarrollo de nuevas funcionalidades, garantizando la máxima calidad y estabilidad del código.

## 2. Principios Fundamentales

### 2.1 Autonomía y Persistencia
- **Trabajo autónomo**: Continuar hasta resolver completamente el problema antes de devolver el control
- **Persistencia**: NUNCA terminar sin haber resuelto verdaderamente el problema
- **Iteración**: Seguir trabajando hasta que todos los elementos de la lista de tareas estén marcados como completados
- **Verificación**: Siempre verificar que los cambios son correctos antes de finalizar

### 2.2 Metodología de Investigación
- **Investigación exhaustiva**: La información de entrenamiento puede estar desactualizada
- **Verificación en línea**: Usar búsquedas web para verificar el uso correcto de librerías y frameworks
- **Documentación actualizada**: Leer contenido de páginas relevantes y seguir enlaces adicionales
- **Información recursiva**: Recopilar toda la información necesaria siguiendo enlaces hasta tener contexto completo

### 2.3 Calidad del Código
- **TypeScript sin errores**: Compilación limpia obligatoria (`bun run tsc`)
- **Tipos semánticamente correctos**: Los tipos deben reflejar la realidad del código
- **Mínima invasión**: Cambios mínimos pero efectivos
- **Compatibilidad**: Mantener compatibilidad con código existente
- **Consistencia**: Seguir patrones establecidos en el proyecto

## 3. Flujo de Trabajo Sistemático

### 3.1 Análisis Inicial
1. **Comprensión profunda**: Leer cuidadosamente el problema y pensar críticamente
2. **Análisis de contexto**: Considerar comportamiento esperado, casos límite y dependencias
3. **Investigación del código**: Explorar archivos relevantes y buscar funciones clave
4. **Investigación en línea**: Buscar artículos, documentación y foros relevantes

### 3.2 Planificación Detallada
1. **Plan paso a paso**: Desglosar la solución en pasos manejables e incrementales
2. **Lista de tareas**: Crear una lista en formato markdown con emojis de estado
3. **Seguimiento**: Marcar cada paso como completado usando sintaxis `[x]`
4. **Continuidad**: Continuar al siguiente paso inmediatamente después de completar uno

### 3.3 Implementación
1. **Cambios incrementales**: Hacer cambios pequeños y probables
2. **Lectura de contexto**: Leer siempre el contenido del archivo antes de editar
3. **Contexto amplio**: Leer al menos 2000 líneas de código para tener contexto suficiente
4. **Variables de entorno**: Crear archivos .env automáticamente cuando sea necesario

### 3.4 Depuración y Testing
1. **Causa raíz**: Determinar la causa raíz en lugar de tratar síntomas
2. **Testing riguroso**: Probar el código exhaustivamente para detectar casos límite
3. **Múltiples pruebas**: Ejecutar pruebas varias veces para asegurar robustez
4. **Logs descriptivos**: Usar declaraciones de impresión y logs para inspeccionar el estado

## 4. Criterios de Aceptación

### 4.1 Criterios Técnicos Obligatorios
- ✅ Compilación TypeScript sin errores (`bun run tsc`)
- ✅ Todos los tipos correctamente definidos
- ✅ Sin conversiones de tipos forzadas innecesarias
- ✅ Interfaces y tipos genéricos funcionando correctamente
- ✅ Pruebas existentes pasando
- ✅ Funcionalidad preservada al 100%

### 4.2 Criterios de Calidad
- ✅ Código mantiene funcionalidad existente
- ✅ Tipos semánticamente correctos
- ✅ Sin introducción de nuevos errores
- ✅ Documentación actualizada cuando sea necesario
- ✅ Patrones de código consistentes

## 5. Gestión de Tareas

### 5.1 Formato de Lista de Tareas
```markdown
- [ ] Paso 1: Descripción del primer paso
- [ ] Paso 2: Descripción del segundo paso
- [ ] Paso 3: Descripción del tercer paso
```

### 5.2 Reglas de Seguimiento
- Usar SOLO formato markdown (nunca HTML)
- Envolver listas en triple backticks
- Mostrar lista actualizada después de cada paso completado
- Continuar inmediatamente al siguiente paso
- Mostrar lista final completada al usuario

## 6. Comunicación y Documentación

### 6.1 Estilo de Comunicación
- **Tono**: Casual, amigable pero profesional
- **Claridad**: Respuestas claras y directas
- **Estructura**: Usar viñetas y bloques de código
- **Concisión**: Evitar explicaciones innecesarias y repetición
- **Acción**: Escribir código directamente a archivos correctos

### 6.2 Ejemplos de Comunicación
- "Voy a buscar la URL que proporcionaste para obtener más información."
- "Perfecto, ya tengo toda la información necesaria sobre la API."
- "Ahora buscaré en el código la función que maneja las solicitudes."
- "Necesito actualizar varios archivos aquí - un momento"
- "¡Excelente! Ahora ejecutemos las pruebas para asegurar que todo funciona."

## 7. Gestión de Archivos y Memoria

### 7.1 Lectura Eficiente
- **Verificar antes de leer**: Comprobar si ya se ha leído un archivo
- **Evitar relecturas**: Solo releer si el contenido ha cambiado
- **Contexto completo**: Asegurar contexto suficiente antes de proceder
- **Memoria interna**: Usar memoria previa para evitar operaciones redundantes

### 7.2 Gestión de Memoria
- Archivo de memoria: `.github/instructions/memory.instruction.md`
- Front matter obligatorio:
```yaml
---
applyTo: '**'
---
```

## 8. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Romper funcionalidad existente | Media | Alto | Testing exhaustivo después de cada cambio |
| Información desactualizada | Alta | Medio | Investigación web obligatoria para librerías |
| Introducir nuevos errores | Baja | Medio | Compilación incremental y revisión rigurosa |
| Cambios incompatibles | Baja | Alto | Mantener interfaces públicas estables |
| Testing insuficiente | Media | Alto | Múltiples ejecuciones de pruebas y casos límite |

## 9. Herramientas y Comandos

### 9.1 Comandos Esenciales
- `bun run tsc` - Verificación de tipos TypeScript
- `bun run test` - Ejecución de pruebas
- `bun run dev` - Servidor de desarrollo
- `bun run build` - Construcción de producción

### 9.2 Herramientas de Desarrollo
- TypeScript para tipado estático
- Bun como runtime y gestor de paquetes
- Vitest para testing
- Biome para linting y formateo

## 10. Casos de Uso Específicos

### 10.1 Corrección de Errores TypeScript
1. Identificar errores específicos con `bun run tsc`
2. Analizar cada error en su contexto
3. Aplicar corrección mínima pero efectiva
4. Verificar que no se rompe funcionalidad
5. Recompilar y verificar solución completa

### 10.2 Desarrollo de Nuevas Funcionalidades
1. Investigar requisitos y dependencias
2. Verificar compatibilidad con arquitectura existente
3. Implementar incrementalmente
4. Probar exhaustivamente
5. Documentar cambios relevantes

### 10.3 Refactoring y Optimización
1. Identificar áreas de mejora
2. Planificar cambios manteniendo compatibilidad
3. Implementar paso a paso
4. Verificar rendimiento y funcionalidad
5. Actualizar documentación

## 11. Control de Versiones

### 11.1 Reglas de Git
- **NUNCA** hacer stage y commit automáticamente
- Solo hacer commit cuando el usuario lo solicite explícitamente
- Mensajes de commit descriptivos y claros
- Commits atómicos por funcionalidad

## 12. Métricas de Éxito

- **Errores TypeScript**: 0 errores en compilación
- **Cobertura de pruebas**: Mantener o mejorar cobertura existente
- **Funcionalidad**: 100% de funcionalidad preservada
- **Rendimiento**: Sin degradación de rendimiento
- **Tiempo de resolución**: Eficiencia en la resolución de problemas
- **Calidad del código**: Mejora continua en legibilidad y mantenibilidad
---

**Prioridad de reglas**: CRÍTICA