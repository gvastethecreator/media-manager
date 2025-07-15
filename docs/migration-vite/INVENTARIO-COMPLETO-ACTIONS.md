# 📋 Inventario Completo de Server Actions - Migración Vite

## 📊 Estado General

**Fecha:** 2 de enero de 2025
**Total de categorías identificadas:** 25+
**Entidades Prisma:** 15 (100% completadas)
**Categorías no-entidad:** 10+ (en análisis)

---

## ✅ **ENTIDADES PRISMA - COMPLETADAS (15/15)**

| Entidad | SDK | Rutas | Estado |
|---------|-----|-------|--------|
| Images | ✅ | ✅ | Completado |
| Folders | ✅ | ✅ | Completado |
| Albums | ✅ | ✅ | Completado |
| Characters | ✅ | ✅ | Completado |
| Collections | ✅ | ✅ | Completado |
| Places | ✅ | ✅ | Completado |
| Concepts | ✅ | ✅ | Completado |
| Notes | ✅ | ✅ | Completado |
| Tags | ✅ | ✅ | Completado |
| World Items | ✅ | ✅ | Completado |
| Wildcards | ✅ | ✅ | Completado |
| Prompts | ✅ | ✅ | Completado |
| Properties | ✅ | 🔄 | SDK listo, falta ruta |
| Groups | ✅ | 🔄 | SDK listo, falta ruta |
| Favorites | ✅ | 🔄 | SDK listo, falta ruta |

---

## 🔄 **CATEGORÍAS NO-ENTIDAD - EN PROGRESO**

### 🔧 **SYSTEM & SETTINGS** (Prioridad: CRÍTICA)

| Acción | Archivo Original | SDK | Rutas | Estado |
|--------|-----------------|-----|-------|--------|
| System Stats | `system/system.actions.ts` | ✅ | 🔄 | SDK creado |
| System Settings | `system/settings.actions.ts` | ✅ | 🔄 | SDK creado |
| System Repair | `system/system.actions.ts` | ✅ | 🔄 | SDK creado |
| Database Reset | `system/system.actions.ts` | ✅ | 🔄 | SDK creado |
| Server Init | `system/init.actions.ts` | ✅ | 🔄 | SDK creado |

### 🔍 **SEARCH & DISCOVERY** (Prioridad: ALTA)

| Acción | Archivo Original | SDK | Rutas | Estado |
|--------|-----------------|-----|-------|--------|
| Global Search | `search/search.actions.ts` | ✅ | 🔄 | SDK creado |
| Image Search | `search/search.actions.ts` | ✅ | 🔄 | SDK creado |

### 🤖 **METADATA & AI** (Prioridad: ALTA)

| Acción | Archivo Original | SDK | Rutas | Estado |
|--------|-----------------|-----|-------|--------|
| Extract Metadata | `metadata/metadata.actions.ts` | ✅ | 🔄 | SDK creado |
| AI Parsers | `metadata/parsers/` | ✅ | 🔄 | SDK creado |
| Update Metadata | `metadata/metadata.actions.ts` | ✅ | 🔄 | SDK creado |
| Bulk Metadata | `metadata/metadata.actions.ts` | ✅ | 🔄 | SDK creado |

### 📸 **MEDIA PROCESSING** (Prioridad: ALTA)

| Acción | Archivo Original | SDK | Rutas | Estado |
|--------|-----------------|-----|-------|--------|
| Generate Thumbnails | `thumbnails/thumbnails.actions.ts` | ✅ | 🔄 | SDK creado |
| Bulk Thumbnails | `thumbnails/thumbnails.actions.ts` | ✅ | 🔄 | SDK creado |
| Cleanup Thumbnails | `thumbnails/thumbnails.actions.ts` | ✅ | 🔄 | SDK creado |
| Image Processing | `images/image-processing.actions.ts` | 🔄 | 🔄 | Pendiente |
| Image Access | `images/image-access.actions.ts` | 🔄 | 🔄 | Pendiente |

### 📊 **STATS & ANALYTICS** (Prioridad: MEDIA)

| Acción | Archivo Original | SDK | Rutas | Estado |
|--------|-----------------|-----|-------|--------|
| General Stats | `stats/stats.actions.ts` | ✅ | 🔄 | SDK creado |
| System Stats Extended | `stats/stats.actions.ts` | ✅ | 🔄 | SDK creado |
| Recent Activity | `stats/stats.actions.ts` | ✅ | 🔄 | SDK creado |
| Top Tags | `stats/stats.actions.ts` | ✅ | 🔄 | SDK creado |
| Storage Breakdown | `stats/stats.actions.ts` | ✅ | 🔄 | SDK creado |

---

## 🔄 **PENDIENTES DE ANÁLISIS**

### ⚙️ **WORKFLOW & TASKS** (Prioridad: MEDIA)

- `workflow/` - Flujos de trabajo
- `tasks/` - Tareas en background
- `queue/` - Cola de trabajos
- `activity/` - Registro de actividades

### 📁 **FILE MANAGEMENT** (Prioridad: MEDIA)

- `uploaded-images/` - Gestión de imágenes subidas
- `files/` - Gestión general de archivos
- `videos/` - Gestión de videos
- `audio/` - Gestión de audio
- `file3d/` - Archivos 3D
- `document/` - Documentos
- `json-file/` - Archivos JSON

### 🛠️ **UTILITIES** (Prioridad: BAJA)

- `presets/` - Presets del sistema
- `debug/` - Herramientas de debug
- `profiles/` - Gestión de perfiles (ya parcialmente en system)

---

## 🎯 **PRÓXIMOS PASOS INMEDIATOS**

### **Fase 1: Completar Infraestructura Base (Esta sesión)**

1. ✅ Crear SDKs para system, search, metadata, thumbnails, stats
2. 🔄 Crear rutas Express correspondientes
3. 🔄 Actualizar servidor principal

### **Fase 2: Media & Processing (Siguiente sesión)**

1. 🔄 Completar SDKs de images (processing, access)
2. 🔄 SDKs para videos, audio, documents
3. 🔄 SDKs para uploaded-images

### **Fase 3: Workflow & Tasks (Futuro)**

1. 🔄 Analizar y crear SDKs para workflow
2. 🔄 Sistema de tasks y queue
3. 🔄 Activity logging

### **Fase 4: Migración de Vistas (Paralelo)**

1. 🔄 Migrar vistas principales que usan las nuevas APIs
2. 🔄 Migrar componentes de settings
3. 🔄 Limpieza final de server actions

---

## 📈 **PROGRESO ACTUALIZADO**

- **Entidades Prisma:** 15/15 SDKs (100%) ✅
- **Rutas Entidades:** 12/15 (80%) 🔄
- **SDKs No-Entidad:** 5/10+ (50%) 🔄
- **Rutas No-Entidad:** 0/10+ (0%) 🔄
- **Vistas Migradas:** 6/30+ (20%) 🔄

**Total estimado de SDKs necesarios:** 25-30
**Completados:** 20/30 (67%)

---

## 💡 **NOTAS TÉCNICAS**

### **Patrones Identificados:**

1. **System APIs** - Configuración, stats, mantenimiento
2. **Processing APIs** - Thumbnails, metadata, transformaciones
3. **Search APIs** - Búsqueda global y específica
4. **Analytics APIs** - Estadísticas y reportes
5. **File APIs** - Gestión de archivos y media

### **Consideraciones:**

- Algunas actions son muy específicas de Next.js (server components)
- Otras pueden convertirse en utilities del cliente
- Priorizar APIs que bloquean funcionalidad principal
- Mantener compatibilidad durante transición
