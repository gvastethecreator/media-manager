debes seguir las tareas de CURRENT-TASK.md

## Workflow para Agentes de IA: Resolución de Errores de PrismaClient en el Cliente

Cuando trabajes en las tareas de `CURRENT-TASK.md` relacionadas con los errores de `PrismaClient` en el cliente, sigue este workflow detallado:

### 1. **Entendimiento del Problema**

* El error `PrismaClient` en el cliente ocurre cuando el módulo `prisma` (o alguna dependencia que lo arrastra) se incluye en el bundle del cliente.
* Esto generalmente sucede porque archivos del lado del servidor (como `mappers.ts`, `serializers.ts`, o `index.ts` de un transformador) que importan `Prisma` son importados por código del lado del cliente (como slices de Zustand store o componentes `use client`).

### 2. **Fase de Identificación y Análisis (Cuando se te asigne una nueva entidad/transformer)**

* **Paso Inicial:** Si se te asigna una nueva entidad (ej. `character`, `collection`, `concept`), el primer paso es ejecutar una búsqueda `grep_search` para `import { prisma } from` dentro del directorio `src/` para esa entidad y sus `transformers`.
  * Ejemplo: `grep_search(query='import { prisma } from', include_pattern='src/transformers/character/*.ts')`
* **Revisar `index.ts` del Transformer:**
  * Lee el `index.ts` del transformer (ej. `src/transformers/character/index.ts`).
  * Busca `re-exportaciones` de funciones o tipos que no deberían ser accedidos directamente por el cliente. Si `index.ts` re-exporta funciones que manipulan `prisma` o sus tipos, considera que este archivo **solo debe exportar funciones del lado del servidor** y **no debe re-exportar** nada destinado al cliente.
  * Si una función como `transformX` (que es segura para el cliente) se re-exporta aquí, asegúrate de que el cliente la importe directamente desde su archivo de origen (ej. `src/transformers/character/transformer.ts` o `src/transformers/character/serializers.ts`) y no desde `index.ts`.
  * **Acción:** Eliminar `re-exportaciones` problemáticas en `index.ts`.
* **Revisar `mappers.ts` y `serializers.ts` del Transformer:**
  * Lee los archivos `mappers.ts` y `serializers.ts` de la entidad.
  * Busca `import type { Prisma } from '@prisma/client';` o cualquier importación de tipos de Prisma.
  * Busca usos de tipos `Prisma.X` en firmas de funciones o dentro de la lógica.
  * **Acción:**
    * Elimina la importación de `Prisma` (`import type { Prisma } from '@prisma/client';`).
    * Reemplaza todos los tipos `Prisma.X` por sus equivalentes de dominio (ej. `AlbumCreateInput`, `AlbumUpdateInput`, `AlbumComplete`) que deben estar definidos en `@/types/entities/X/types.ts`. Si un tipo equivalente no existe, notifica al usuario o crea uno genérico apropiado si es trivial.
    * Asegúrate de que `mappers.ts` y `serializers.ts` se centren **únicamente en la transformación de datos** y no realicen operaciones directas con `prisma`.

### 3. **Fase de Ajuste del Store (Lado del Cliente)**

* **Identificar el Slice del Store:** Encuentra el slice de Zustand store correspondiente a la entidad (ej. `src/store/entities/character/slices/core.ts`).
* **Revisar Importaciones:**
  * Busca importaciones de funciones de transformación que hayan sido modificadas en la fase anterior (ej. `mapCreateXDataToPrisma`).
  * Busca cualquier llamada directa a rutas `/api/entities/X` usando `fetch`.
* **Asegurar Uso de Server Actions:**
  * Las operaciones CRUD (crear, actualizar, eliminar, obtener datos) en el slice del store **deben llamar a las Server Actions correspondientes** (ej. `createCharacterAction`, `deleteCharacterAction`, `getCharactersAction`, `updateCharacterAction`).
  * **Acción:**
    * Elimina las importaciones de `mappers` o `serializers` que ya no son necesarias o que fueron limpiadas en la fase anterior.
    * Asegura que la lógica dentro de las funciones asíncronas del store (ej. `createCharacter`) llame directamente a las Server Actions con los datos de dominio, dejando que la Server Action se encargue de cualquier mapeo a tipos de Prisma en el servidor.
    * Si hay una estrategia de respaldo con llamadas `fetch` a rutas API, evalúa si es realmente necesaria. En muchos casos, si la Server Action es robusta, la llamada `fetch` de respaldo puede ser eliminada para simplificar el código. Si se mantiene, asegúrate de que la ruta API también encapsule la lógica de Prisma en el servidor.

### 4. **Fase de Verificación**

* **Re-ejecutar Búsqueda de Prisma:** Después de realizar todas las correcciones, vuelve a ejecutar `grep_search` para `import { prisma } from` en el directorio `src/` para confirmar que ya no aparece en archivos del lado del cliente.
* **Revisar Consola del Navegador:** Inicia la aplicación y navega por las funcionalidades relacionadas con la entidad modificada. Busca cualquier error de `PrismaClient` en la consola del navegador.
* **Reportar a `CURRENT-TASK.md`:** Actualiza el estado de las tareas en `CURRENT-TASK.md` y reporta cualquier nuevo hallazgo o problema.

### Reglas a Seguir Constantemente

* **`nextjs-best-practices`**: Siempre prioriza Server Components y Server Actions para lógica de servidor y mutaciones. Usa `use client` solo para interactividad.
* **`typescript-best-practices`**: Mantén la tipificación estricta. Usa interfaces para formas de objetos y `type` para utilidades. Evita el uso de `any` si es posible.
* **`prisma-data-access-best-practices`**: `PrismaClient` debe ser usado **exclusivamente en el lado del servidor**. Nunca lo importes ni lo uses en archivos que se compilan para el cliente.
* **`react-best-practices`**: Componentes pequeños, funcionales y con responsabilidades claras.
* **`CORE_PRINCIPLES`**: Sigue las directrices generales del proyecto (comentarios, emojis, documentación, etc.).

---

# AGENTS.md (actualización junio 2025)

## Checklist de testing y convenciones

* Los agentes y slices no deben importar Prisma ni tipos de servidor.

* Los tests deben usar mocks globales definidos en `jest.setup.ts` para Prisma y p-queue.
* Usar `waitFor` en asserts de efectos asíncronos.
* Los tests de Zustand stores y hooks deben evitar dependencias cruzadas y mocks inconsistentes.
* Documentar cualquier convención nueva tras cada iteración.

## Hallazgos recientes

* Se corrigieron dependencias de Prisma y tipos de servidor en slices y agentes.

* Se mejoró la cobertura de tests unitarios y de integración para slices y hooks.
* Se documentó el uso de QueryClientProvider y mocks globales en tests de hooks.

## 📋 Convenciones de testing y cobertura mínima

* Todo feature nuevo debe incluir tests unitarios y/o de integración según corresponda.
* La cobertura mínima esperada es 80% (statements, branches, functions, lines).
* Seguir las convenciones de imports y tipado documentadas en `src/tests/README.md` y `TRANSFORMERS-FIX.md`.
* Los tests deben mockear dependencias de servidor y nunca acceder a Prisma directamente desde el cliente.
* Documentar cualquier excepción o workaround relevante en los archivos de test o en la documentación de testing.

## Convenciones de testing y cobertura mínima esperada (junio 2025)

* Todos los slices de Zustand y transformadores deben tener tests unitarios que no dependan de Prisma ni de servicios de servidor.
* Los tests de componentes deben usar mocks y helpers de `@/tests/helpers/test-utils`.
* La cobertura mínima esperada es del 80% en statements, branches, functions y lines.
* Mantener actualizado el checklist de cobertura en `src/tests/README.md` y reportar hallazgos relevantes en este archivo.

---

## Traspaso de contexto para el siguiente agente (junio 2025)

* Los tests de tarjetas y servicios han sido revisados para que los selectores y asserts coincidan con el markup real.
* Los mocks globales de prisma y p-queue están definidos en `jest.setup.ts` para evitar errores de importación en tests que usan código de servidor.
* Se eliminaron archivos de test duplicados y se ajustaron los asserts para evitar warnings de act y errores de tipado.
* El moduleNameMapper en `jest.config.ts` está configurado para que las rutas `@/` apunten a `src/`.
* Pendiente: Validar que los tests funcionales de servicios pasen sin errores de rutas/moduleNameMapper y documentar cualquier hallazgo nuevo.
* Recomendación: tras cualquier cambio en markup o lógica de componentes, revisar y ajustar los tests y mocks para mantener la robustez de la suite.
* Documentar siempre los hallazgos y convenciones en los archivos de documentación correspondientes.
