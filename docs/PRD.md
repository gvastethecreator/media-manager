# Documento de Requerimientos del Producto (PRD)

## Image Manager - Sistema de Gestión Multimedia

**Versión:** 0.1.0  
**Última Actualización:** 31 de diciembre de 2025  
**Estado:** En desarrollo activo

---

## 1. Visión General del Producto

### 1.1 Propósito

Image Manager es un sistema integral de gestión multimedia diseñado para organizar, indexar y visualizar grandes volúmenes de archivos multimedia con alto rendimiento en entornos locales.

### 1.2 Origen y Motivación

El proyecto nació como solución para organizar imágenes generadas con IA, evolucionando hacia un organizador multimedia completo que:

- Indexa archivos y extrae metadatos automáticamente
- Permite crear sistemas de organización complejos y personalizables
- Combina **organización física** (estructura de carpetas) con **organización digital** (base de datos con etiquetas, álbumes, relaciones)
- Gestiona archivos sin necesidad de moverlos de su ubicación original

### 1.3 Usuarios Objetivo

- **Artistas digitales** que trabajan con IA generativa
- **Fotógrafos y videógrafos** con grandes bibliotecas
- **Creadores de contenido** que necesitan organización avanzada
- **Desarrolladores de juegos** (worldbuilding, personajes, assets)
- **Investigadores** con colecciones de datos visuales

---

## 2. Características Principales

### 2.1 Tipos de Archivos Soportados

#### Multimedia Principal

| Tipo | Extensiones Soportadas |
|------|------------------------|
| **Imágenes** | JPG, PNG, WebP, GIF |
| **Videos** | MP4, WebM, MOV, AVI, MKV |
| **Audio** | WAV, FLAC, MP3, OGG, M4A, AAC, WMA |

#### Contenido Especializado

| Tipo | Extensiones Soportadas |
|------|------------------------|
| **Modelos 3D** | OBJ, FBX, GLB (optimizados para web) |
| **Documentos** | MD, TXT, CSV |
| **Datos Estructurados** | JSON |

### 2.2 Sistema de Organización

#### 2.2.1 Organizadores Básicos

**🏷️ Tags (Etiquetas)**

- Etiquetas simples para categorización rápida
- Sistema de colores y emojis personalizables
- Relaciones flexibles con todo tipo de contenido

**📸 Álbumes**

- Agrupaciones temáticas de archivos multimedia
- Ideal para colecciones temporales o proyectos específicos
- Metadata enriquecida con descripción y configuración visual

**📂 Grupos**

- Meta-organizadores que permiten agrupar cualquier entidad
- Sistema jerárquico para taxonomías complejas
- Configuración avanzada de filtros y ordenamiento

#### 2.2.2 Entidades Dinámicas

**🔧 Wildcards**

- Plantillas y variables dinámicas para automatización
- Sistema jerárquico con relaciones padre-hijo
- Generación de contenido parametrizable

**🔍 Properties (Propiedades)**

- Descriptores de características específicas (color, forma, estilo)
- Sistema de metadatos granular para búsquedas avanzadas

#### 2.2.3 Colecciones NFT

**💎 Collections**

- Organización específica para NFTs y arte digital
- Metadatos blockchain: contratos, tokens, networks, pricing
- Integración con plataformas y marketplaces
- Gestión de ediciones y rareza

#### 2.2.4 Entidades Abstractas

**💡 Concepts (Conceptos)**

- Ideas y referencias conceptuales
- Sistema de conocimiento interconectado
- Base para sistemas de IA y generación automática

**📝 Notes (Notas)**

- Sistema de anotaciones con prioridades y estados
- Markdown compatible para documentación rica
- Integración con flujos de trabajo

**🎯 Prompts**

- Plantillas para generación de IA
- Parametrización avanzada con wildcards
- Versionado y optimización iterativa

#### 2.2.5 Worldbuilding

**👤 Characters (Personajes)**

- Personajes completos con stats, backstory, relaciones
- Sistema de niveles, clases y alineamientos
- Perfiles psicológicos y sociales detallados

**📍 Places (Lugares)**

- Ubicaciones con clima, gobierno, población
- Historia, peligros y recursos
- Integración geográfica y narrativa

**🎯 World Items (Objetos del Mundo)**

- Objetos con atributos y efectos
- Sistema de rareza y requisitos
- Estadísticas y mecánicas de juego

#### 2.2.6 Gestión Documental

**📄 Documents**

- Archivos markdown y texto plano
- Compatible con Obsidian vaults
- Sistema de enlaces bidireccionales

**⚙️ Workflows**

- Flujos de trabajo complejos en JSON
- Automatización de procesos
- Integración con herramientas externas

### 2.3 Sistema de Favoritos Multi-Perfil

- Favoritos personalizados por perfil de usuario
- Cualquier entidad puede ser marcada como favorita
- Sincronización inteligente entre perfiles

---

## 3. Requerimientos Funcionales

### 3.1 Navegación de Archivos

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-01 | El sistema debe permitir navegación por carpetas con estructura jerárquica | Alta |
| RF-02 | El sistema debe soportar múltiples modos de vista (Grid, Lista, Masonry, Cards) | Alta |
| RF-03 | El sistema debe implementar virtualización para manejo de +1000 archivos | Alta |
| RF-04 | El sistema debe generar thumbnails optimizados automáticamente | Alta |
| RF-05 | El sistema debe extraer y mostrar metadatos EXIF/XMP | Media |

### 3.2 Organización de Contenido

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-06 | El sistema debe permitir crear y gestionar tags con colores y emojis | Alta |
| RF-07 | El sistema debe permitir crear álbumes y añadir archivos | Alta |
| RF-08 | El sistema debe soportar relaciones many-to-many entre entidades | Alta |
| RF-09 | El sistema debe calcular estadísticas por entidad (conteos, favoritos) | Media |
| RF-10 | El sistema debe permitir búsqueda avanzada con múltiples filtros | Media |

### 3.3 Visualización

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-11 | El sistema debe proporcionar un visor de archivos integrado | Alta |
| RF-12 | El sistema debe soportar navegación por teclado en el visor | Media |
| RF-13 | El sistema debe mostrar panel de detalles contextual | Media |
| RF-14 | El sistema debe soportar zoom y pan en imágenes | Baja |

### 3.4 Gestión de Archivos

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-15 | El sistema debe permitir reindexar carpetas | Alta |
| RF-16 | El sistema debe detectar cambios en sistema de archivos | Media |
| RF-17 | El sistema debe soportar operaciones bulk (selección múltiple) | Media |
| RF-18 | El sistema debe integrar menú contextual con operaciones | Media |

---

## 4. Requerimientos No Funcionales

### 4.1 Rendimiento

| ID | Requerimiento | Métrica |
|----|---------------|---------|
| RNF-01 | El sistema debe mantener 60 FPS con +1000 archivos | 60 FPS mínimo |
| RNF-02 | Las operaciones de UI deben responder en <100ms | < 100ms |
| RNF-03 | La generación de thumbnails debe ser asíncrona | Background |
| RNF-04 | El sistema debe usar lazy loading para recursos | On-demand |

### 4.2 Usabilidad

| ID | Requerimiento |
|----|---------------|
| RNF-05 | La interfaz debe ser responsive y adaptarse a diferentes tamaños |
| RNF-06 | El sistema debe soportar temas claro/oscuro |
| RNF-07 | El sistema debe proporcionar feedback visual para operaciones |
| RNF-08 | La navegación debe ser consistente en toda la aplicación |

### 4.3 Mantenibilidad

| ID | Requerimiento |
|----|---------------|
| RNF-09 | El código debe estar tipado con TypeScript estricto |
| RNF-10 | La arquitectura debe ser modular y extensible |
| RNF-11 | El sistema debe tener logging configurable |
| RNF-12 | Las APIs deben estar documentadas |

### 4.4 Compatibilidad

| ID | Requerimiento |
|----|---------------|
| RNF-13 | El sistema debe funcionar como aplicación web |
| RNF-14 | El sistema debe funcionar como aplicación de escritorio (Tauri) |
| RNF-15 | El sistema debe soportar Windows, macOS y Linux |

---

## 5. Stack Tecnológico

### 5.1 Frontend

- **Framework:** React 19.2.3
- **Bundler:** Vite 7.3.0
- **Estado:** Zustand 5.0.9
- **Data Fetching:** TanStack Query 5.90.14
- **UI Components:** Radix UI + Tailwind CSS 4.1.18
- **Virtualización:** TanStack Virtual 3.13.13
- **Animaciones:** GSAP 3.14.2

### 5.2 Backend

- **Runtime:** Bun
- **Framework:** Express 5.2.1
- **ORM:** Drizzle ORM 0.45.1
- **Base de Datos:** SQLite (via @libsql/client)
- **Programación Funcional:** Effect-TS 3.19.13

### 5.3 Desktop

- **Framework:** Tauri 2.9.6
- **Lenguaje Nativo:** Rust

### 5.4 Procesamiento de Medios

- **Imágenes:** Sharp 0.34.5
- **Metadatos:** exifr 7.1.3
- **Audio:** music-metadata 11.10.3
- **Video:** ffprobe-static 3.1.0, mediabunny 1.27.2

### 5.5 Testing

- **Unit/Integration:** Vitest 4.0.16
- **E2E:** Playwright 1.57.0

### 5.6 Calidad de Código

- **Linting/Formatting:** Biome 2.3.10
- **Type Checking:** TypeScript 5.9.3

---

## 6. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Components│  │  Stores  │  │  Hooks   │  │  TanStack Query  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/SSE
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express + Bun)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Routes  │  │ Services │  │Transforms│  │    Effect-TS     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Drizzle ORM + SQLite                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Schemas  │  │Relations │  │  Seeds   │  │   Migrations     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Sistema de Archivos Local                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Imágenes │  │  Videos  │  │  Audio   │  │   Documentos     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Roadmap

### Fase Actual (v0.1.0)

- ✅ Sistema base de navegación de carpetas
- ✅ Gestión de imágenes y thumbnails
- ✅ Sistema de tags y álbumes
- ✅ Visor de archivos integrado
- ✅ Panel de detalles contextual
- ✅ Soporte para múltiples tipos de media
- 🔄 Migración a Effect-TS (96% completo)

### Próximas Fases

- **v0.2.0:** Sistema de búsqueda FTS5 completo
- **v0.3.0:** Mejoras UX/UI según auditoría
- **v0.4.0:** Integración Tauri estable
- **v0.5.0:** Sistema de plugins/extensiones

---

## 8. Glosario

| Término | Definición |
|---------|------------|
| **Entity** | Cualquier objeto del dominio (imagen, video, tag, álbum, etc.) |
| **EntityStats** | Estadísticas asociadas a una entidad (conteos, favoritos) |
| **Folder** | Carpeta física del sistema de archivos indexada |
| **Reindex** | Proceso de escaneo y actualización de archivos en una carpeta |
| **Thumbnail** | Imagen miniatura generada para preview |
| **Wildcard** | Variable dinámica para generación de contenido |
| **Worldbuilding** | Módulo para construcción de mundos ficticios |

---

## 9. Referencias

- [README del Proyecto](../README.md)
- [Guía de Arquitectura](./ARCHITECTURE.md)
- [Referencia de API](./API-REFERENCE.md)
- [Esquema de Base de Datos](./DATABASE-SCHEMA.md)
