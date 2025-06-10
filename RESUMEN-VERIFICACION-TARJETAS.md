# Verificación de Tarjetas y Tests de UI

Este archivo resume el trabajo de depuración realizado sobre los tests de tarjetas (cards) del proyecto.

## Problemas encontrados

- Los selectores y asserts de los tests no coincidían con el marcado real de los componentes.
- Algunos archivos de prueba estaban duplicados o contenían código obsoleto.
- Se registraban errores de `act` y fallos de tipos al ejecutar la suite de Jest.

## Acciones realizadas

1. **Actualización de selectores**
   - Se ajustaron los tests para buscar botones y artículos con `role="button"` cuando aplica.
   - Los badges de favorito se verifican por el icono Lucide correspondiente.
2. **Limpieza de pruebas**
   - Se eliminó el archivo `use-folder-images.test.ts` que estaba duplicado y con errores de sintaxis.
3. **Ajustes de configuración**
   - Se revisó el `moduleNameMapper` en `jest.config.ts` para resolver rutas `@/` correctamente.
   - Los mocks globales de Prisma y p-queue se definen en `jest.setup.ts`.

## Resultado

Tras aplicar estas correcciones la suite de tests de componentes se ejecuta sin fallos y refleja fielmente el comportamiento de las tarjetas.
