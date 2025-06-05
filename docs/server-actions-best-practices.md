# Mejores Prácticas para Server Actions en Next.js 15.3.3

## Introducción

Este documento presenta las mejores prácticas para trabajar con Server Actions en Next.js 15.3.3, basadas en la experiencia adquirida durante la refactorización de nuestra aplicación. Las Server Actions son una característica poderosa que permite ejecutar código en el servidor desde componentes cliente, pero requieren seguir ciertas convenciones para funcionar correctamente.

## Restricciones de Server Actions

Los archivos que usan la directiva `'use server'` tienen las siguientes restricciones:

1. **Solo se pueden exportar funciones asíncronas**
   - Error: `Only async functions are allowed to be exported in a "use server" file.`
   - No se pueden exportar:
     - Funciones síncronas
     - Clases o instancias de clases
     - Objetos o tipos
     - Re-exportaciones directas (`export * from './otro-archivo'`)

2. **Las funciones exportadas deben ser serializables**
   - Todas las entradas y salidas deben poder serializarse para pasar entre cliente y servidor
   - No se pueden usar clases, solo objetos planos

## Patrones Recomendados

### 1. Exportar solo funciones asíncronas

```typescript
// ❌ Incorrecto: exportar función síncrona
export function hacerAlgo() {
  return 'resultado';
}

// ✅ Correcto: exportar función asíncrona
export async function hacerAlgo() {
  return 'resultado';
}
```

### 2. Convertir exportaciones directas a exportaciones individuales

```typescript
// ❌ Incorrecto: exportación directa
export * from './acciones';

// ✅ Correcto: importar y re-exportar individualmente
import * as Acciones from './acciones';
export const accion1 = Acciones.accion1;
export const accion2 = Acciones.accion2;
```

### 3. Separar utilidades síncronas

Para funciones síncronas (como validaciones, transformaciones, etc.) crear archivos separados:

```typescript
// utils.ts (sin 'use server')
export function validar(datos) {
  // Validación síncrona
}

// actions.ts ('use server')
import { validar } from './utils';

export async function guardar(datos) {
  validar(datos); // Usar función síncrona internamente
  // Guardar datos
}
```

### 4. Enfoque funcional para manejo de errores

```typescript
// ❌ Incorrecto: usar clases de error
export class MiError extends Error {
  constructor(mensaje) {
    super(mensaje);
  }
}

// ✅ Correcto: usar interfaces y funciones creadoras
export interface MiError {
  code: string;
  message: string;
  timestamp: number;
}

export function crearMiError(mensaje: string): MiError {
  return {
    code: 'MI_ERROR',
    message: mensaje,
    timestamp: Date.now()
  };
}

export function esMiError(error: unknown): error is MiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'MI_ERROR'
  );
}
```

### 5. Separar componentes cliente y servidor

Para exportar utilidades que serán usadas tanto en cliente como en servidor:

1. Crear un archivo para cliente con `'use client'`
2. Crear un archivo para servidor con `'use server'`

```typescript
// client-exports.ts ('use client')
export {
  funcionCliente1,
  funcionCliente2
} from '@/algun/modulo';

// server-actions.ts ('use server')
export async function accionServidor1() { /* ... */ }
export async function accionServidor2() { /* ... */ }
```

## Ejemplos de Refactorización

### 1. Manejo de errores

Antes:
```typescript
export class SettingsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SettingsError';
  }
}
```

Después:
```typescript
// settings.errors.ts
export interface SettingsError {
  code: string;
  message: string;
  name: string;
}

export function createSettingsError(message: string, code: string): SettingsError {
  return {
    code,
    message,
    name: 'SettingsError'
  };
}

export function isSettingsError(error: unknown): error is SettingsError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'SettingsError'
  );
}

// settings.actions.ts ('use server')
import { createSettingsError, isSettingsError } from './settings.errors';

export async function updateSettings(data: SettingsData) {
  try {
    // ... lógica
  } catch (error) {
    if (isSettingsError(error)) {
      throw error; // Re-lanzar error existente
    }
    throw createSettingsError('Error actualizando configuración', 'UPDATE_FAILED');
  }
}
```

### 2. Exportaciones de módulos

Antes:
```typescript
// index.ts ('use server')
export * from './crud.actions';
export * from './query.actions';
export * from './transformers';
```

Después:
```typescript
// index.ts ('use server')
import * as CrudActions from './crud.actions';
import * as QueryActions from './query.actions';

export const createEntity = CrudActions.createEntity;
export const updateEntity = CrudActions.updateEntity;
export const deleteEntity = CrudActions.deleteEntity;

export const getEntity = QueryActions.getEntity;
export const searchEntities = QueryActions.searchEntities;

// client-exports.ts ('use client')
export {
  transformEntity,
  validateEntity,
  mapEntityData
} from '@/transformers/entity';
```

## Consideraciones Adicionales

1. **Verificación de tipos de errores**: Usar verificación basada en propiedades en lugar de `instanceof`
2. **Evitar exportaciones innecesarias**: Solo exportar lo que realmente necesita ser público
3. **Organización por responsabilidades**: Separar utilidades, validaciones y acciones
4. **Documentación clara**: Indicar claramente qué se debe importar y desde dónde

## Resolución de Problemas Comunes

1. **Error**: `Only async functions are allowed to be exported in a "use server" file.`
   **Solución**: Convertir a función asíncrona o mover a un archivo cliente separado.

2. **Error**: `Functions cannot be passed directly to Client Components unless you explicitly mark them with "use server"`
   **Solución**: Asegurarse de que la función tiene la directiva 'use server' o está en un archivo con esta directiva.

3. **Error**: `Module not found: Can't resolve './module-name'`
   **Solución**: Verificar que el módulo existe y está correctamente referenciado.

## Conclusión

Siguiendo estas mejores prácticas, podrás aprovechar las Server Actions de Next.js 15.3.3 de manera efectiva, manteniendo un código limpio, mantenible y libre de errores. La clave está en entender las restricciones y adaptar el código para trabajar dentro de ellas, separando claramente las responsabilidades entre cliente y servidor.
