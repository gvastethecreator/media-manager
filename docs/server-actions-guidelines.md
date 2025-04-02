# Guía para Server Actions en Next.js 15

## Introducción

Las Server Actions en Next.js 15 permiten ejecutar código asíncrono en el servidor directamente desde componentes del cliente o servidor. Esta guía describe las mejores prácticas y patrones a seguir al implementar Server Actions en nuestra aplicación de gestión de imágenes.

## Reglas Fundamentales

### Directiva 'use server'

1. La directiva `'use server'` debe ser la primera línea del archivo (no puede haber importaciones antes).
2. Solo se pueden exportar funciones asíncronas (`async`) desde archivos con `'use server'`.
3. No se pueden utilizar exportaciones directas como `export * from './otro-archivo'` en archivos con `'use server'`.

## Estructura de Archivos

### Patrón Recomendado

1. **Archivos de implementación**: Contienen la lógica de negocio y llevan la directiva `'use server'`.
2. **Archivos índice**: No llevan `'use server'` y re-exportan las funciones para facilitar su uso.

```
actions/
├── entity/
│   ├── index.ts              # Sin 'use server', re-exportaciones simples
│   ├── entity-crud.actions.ts    # Con 'use server', implementaciones
│   ├── entity-query.actions.ts   # Con 'use server', implementaciones
│   └── ...
└── ...
```

## Patrones de Exportación

### ❌ Incorrecto: Archivos con 'use server' y exportaciones directas

```typescript
'use server';

// INCORRECTO: Esto no está permitido en archivos con 'use server'
export * from './entity-crud.actions';
export * from './entity-query.actions';
```

### ✅ Correcto: Archivos índice sin 'use server'

```typescript
// index.ts (sin 'use server')

// CORRECTO: Exportaciones directas en archivos sin 'use server'
export * from './entity-crud.actions';
export * from './entity-query.actions';
```

### ✅ Correcto: Wrapper asíncrono para archivos con 'use server'

Si necesitas un archivo con `'use server'` que re-exporte funciones, debes usar este patrón:

```typescript
'use server';

// Importar con alias para claridad
import {
    createEntity as createEntityImpl,
    updateEntity as updateEntityImpl,
    deleteEntity as deleteEntityImpl
} from './entity-crud.actions';

import {
    getEntity as getEntityImpl,
    listEntities as listEntitiesImpl
} from './entity-query.actions';

// Re-exportar como funciones asíncronas
export async function createEntity(data: any) {
    return createEntityImpl(data);
}

export async function updateEntity(id: string, data: any) {
    return updateEntityImpl(id, data);
}

export async function deleteEntity(id: string) {
    return deleteEntityImpl(id);
}

export async function getEntity(id: string) {
    return getEntityImpl(id);
}

export async function listEntities(filters?: any) {
    return listEntitiesImpl(filters);
}
```

## Manejo de Errores en Server Actions

### Enfoque Funcional para Errores

En Server Actions, es recomendable adoptar un enfoque funcional para el manejo de errores en lugar de utilizar clases, debido a las siguientes razones:

1. **Mejor Serialización**: Las funciones y objetos planos son más fáciles de serializar/deserializar entre cliente y servidor.
2. **Compatibilidad con RSC**: React Server Components trabajan mejor con estructuras de datos simples.
3. **Mantenibilidad**: Código más simple y predecible, sin la complejidad de la herencia de clases.

### ❌ Incorrecto: Uso de clases para errores

```typescript
'use server';

// INCORRECTO: Definir clases de error en archivos con 'use server'
export class EntityError extends Error {
  code: string;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = 'EntityError';
    this.code = code;
    this.cause = cause;
  }
}

export async function createEntity(data: any) {
  try {
    // Lógica de implementación
  } catch (error) {
    // Problema: No se serializa bien entre cliente y servidor
    throw new EntityError('Error al crear entidad', 'CREATE_FAILED', error);
  }
}
```

### ✅ Correcto: Enfoque funcional para errores

```typescript
'use server';

// CORRECTO: Definir interfaces y funciones creadoras
export interface EntityErrorData {
  name: string;
  message: string;
  code: string;
  cause?: unknown;
}

// Función creadora de errores (no exportada si solo se usa internamente)
function createEntityError(
  message: string,
  code: string,
  cause?: unknown
): EntityErrorData {
  return {
    name: 'EntityError',
    message,
    code,
    cause
  };
}

export async function createEntity(data: any) {
  try {
    // Lógica de implementación
  } catch (error) {
    // Mejor: Objeto plano que se serializa correctamente
    throw createEntityError('Error al crear entidad', 'CREATE_FAILED', error);
  }
}
```

### Verificación de Tipos de Error

Al verificar tipos de error, evita usar `instanceof` (que no funciona con interfaces) y utiliza verificaciones basadas en propiedades:

#### ❌ Incorrecto: Uso de instanceof

```typescript
'use server';

try {
  // Alguna operación
} catch (error) {
  // INCORRECTO: No funciona con interfaces ni después de serialización
  if (error instanceof EntityError) {
    // Manejo específico
  }
  throw error;
}
```

#### ✅ Correcto: Verificación basada en propiedades

```typescript
'use server';

try {
  // Alguna operación
} catch (error) {
  // CORRECTO: Verifica por propiedades, funciona con objetos serializados
  if (error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'EntityError') {
    // Manejo específico
  }
  throw error;
}
```

### Gestión de Errores entre Cliente y Servidor

Cuando los errores viajan entre el cliente y el servidor, deben conservar información útil:

```typescript
'use client';

import { createEntity } from '@/app/actions/entity';

export function EntityForm() {
  const handleSubmit = async (formData: FormData) => {
    try {
      await createEntity(Object.fromEntries(formData));
    } catch (error) {
      // Acceder a las propiedades del error
      if (error &&
          typeof error === 'object' &&
          'name' in error &&
          error.name === 'EntityError') {
        // Mostrar mensaje amigable basado en el código de error
        const entityError = error as EntityErrorData;
        if (entityError.code === 'VALIDATION_FAILED') {
          // Manejo de error de validación
        } else if (entityError.code === 'DUPLICATE_ENTRY') {
          // Manejo de error de duplicado
        }
      } else {
        // Error genérico
        console.error('Error desconocido:', error);
      }
    }
  };

  return (
    <form action={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
}
```

## Errores Comunes y Soluciones

### 1. Exportación de funciones síncronas en archivos con 'use server'

**Error**: `Server Actions must be async functions.`

**Problema**:
```typescript
'use server';

// Esto generará un error
export function createDefaultConfig(): Config {
  return { /* ... */ };
}
```

**Solución**:
```typescript
'use server';

// Convertir a función asíncrona
export async function createDefaultConfig(): Promise<Config> {
  return { /* ... */ };
}
```

### 2. Exportación directa de módulos en archivos con 'use server'

**Error**: `Only async functions are allowed to be exported in a "use server" file.`

**Problema**:
```typescript
'use server';

// Esto generará un error
export * from './otherModule';
```

**Solución**:
1. Quitar la directiva 'use server' del archivo de índice:
```typescript
// Sin 'use server' - ahora es seguro
export * from './otherModule';
```

2. O implementar wrappers asincrónicos:
```typescript
'use server';

// Importar cada función individualmente
import { func1, func2 } from './otherModule';

// Re-exportar como asíncronas
export async function wrappedFunc1() {
  return func1();
}

export async function wrappedFunc2() {
  return func2();
}
```

### 3. Exportación de módulos inexistentes

**Error**: `Module not found: Can't resolve './nonexistent-module'`

**Problema**:
```typescript
// Esto generará un error
export * from './nonexistent-module';
```

**Solución**:
1. Comentar la exportación si el módulo se creará en el futuro:
```typescript
// TODO: Crear este módulo o eliminar esta referencia
// export * from './nonexistent-module';
```

2. O crear el módulo faltante

### 4. Mezclar directivas y exportaciones

**Error**: `Syntax error: 'use server' must be at the top of the file.`

**Problema**:
```typescript
// Importación antes de use server
import { something } from './somewhere';

'use server'; // Error: no es la primera línea
```

**Solución**:
```typescript
'use server';

import { something } from './somewhere';
```

## Arquitectura Recomendada

### Separación de Responsabilidades

1. **Archivos de implementación**: Archivos con `'use server'` que contienen solo funciones asíncronas:
   - `entity-crud.actions.ts` - Operaciones de creación, actualización y eliminación
   - `entity-query.actions.ts` - Operaciones de consulta y búsqueda
   - `entity-process.actions.ts` - Procesamiento de entidades
   - `entity-stats.actions.ts` - Estadísticas y métricas

2. **Archivos índice**: Archivos sin `'use server'` que re-exportan las funciones implementadas:
   - `index.ts` - Re-exporta todas las funciones necesarias para ser usadas en la aplicación

### Verificación de Módulos

Antes de importar o exportar un módulo, asegúrate de que realmente existe:

```typescript
// CORRECTO: Verificar que estos módulos existan antes de exportarlos
export * from './entity-crud.actions';
export * from './entity-query.actions';

// INCORRECTO: No exportar módulos que no existen
export * from './entity-nonexistent.actions'; // ❌ Este archivo no existe
```

## Diferenciación de Archivos

### Archivos de Tipos vs. Archivos de Acciones

Es importante distinguir entre diferentes tipos de archivos:

1. **Archivos de tipos** (`*-types.ts`):
   - No llevan la directiva 'use server'
   - Pueden exportar interfaces, tipos y funciones síncronas
   - Se utilizan para definir la forma de los datos y operaciones utilitarias

```typescript
// folder-types.ts - Sin 'use server'
export interface FolderData { /* ... */ }

// Función síncrona (válida en archivos sin 'use server')
export function createFolderError(message: string): FolderError {
  return { /* ... */ };
}
```

2. **Archivos de acciones** (`*.actions.ts`):
   - Llevan la directiva 'use server'
   - Solo exportan funciones asíncronas
   - Implementan la lógica de negocio que se ejecuta en el servidor

```typescript
'use server';

// Solo funciones asíncronas exportadas
export async function createFolder(data: FolderData): Promise<Folder> {
  // Implementación
}
```

## Resolución de Problemas Comunes

### Error: Only async functions are allowed to be exported in a "use server" file

**Causa**: Estás exportando funciones no asíncronas o usando `export *` en un archivo con `'use server'`.

**Solución**:
1. Convierte todas las funciones exportadas a asíncronas (`async`).
2. O mueve las exportaciones directas a un archivo sin `'use server'`.
3. O implementa el patrón de wrapper asíncrono descrito arriba.

### Error: Module not found: Can't resolve './module-name'

**Causa**: Estás importando o exportando un módulo que no existe.

**Solución**:
1. Verifica que el archivo realmente exista en la ruta especificada.
2. Corrije la ruta de importación o crea el módulo faltante.
3. Si es un módulo que se creará en el futuro, comenta la exportación por ahora.

## Conclusión

Siguiendo estos patrones y mejores prácticas, mantendremos un código limpio, predecible y libre de errores al trabajar con Server Actions en Next.js 15. Estos patrones aseguran que nuestro código se adhiera a las restricciones del framework mientras mantiene una buena arquitectura y organización.

Recuerda que las restricciones de `'use server'` están diseñadas para asegurar un límite claro entre código del servidor y cliente, mejorando la seguridad y predecibilidad de nuestra aplicación.
