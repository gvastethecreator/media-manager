# 📁 File: Tipos y Esquemas Canónicos

Este módulo define los **tipos canónicos** y extendidos para la entidad `File`, alineados con el modelo de dominio y las reglas del proyecto.

## 📦 Estructura

```mermaid
graph TD
    FileBase --> FileCreateInput
    FileBase --> FileUpdateInput
    FileBase --> EnhancedImageFile
    EnhancedImageFile --> FileType
    EnhancedImageFile --> FileErrorCode
    EnhancedImageFile --> FileEventType
```

- `FileBase`: Tipo canónico alineado a la base de datos.
- `EnhancedImageFile`: Tipo extendido para imágenes con metadatos enriquecidos.
- `FileCreateInput`, `FileUpdateInput`: Inputs para mutaciones.
- `FileType`, `FileErrorCode`, `FileEventType`: Enums para lógica y validación.

## 🚨 Notas de migración

- **Legacy eliminado:** Solo se exportan tipos y enums canónicos.
- **No importar tipos de Prisma ni archivos legacy.**
- **Validar siempre con Zod antes de persistir.**

## 📝 Ejemplo de uso

```ts
import type { FileBase, FileCreateInput } from '@/types/entities/file';
// Validar con Zod según lógica de negocio
```

---

> Última actualización: 2025-06-18
> Responsable: migración y limpieza de tipos canónicos
