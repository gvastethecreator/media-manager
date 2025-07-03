# Plan de Migración Completo - Restauración de Funcionalidad

## 📋 Estado Actual (✅ FUNCIONANDO)

### ✅ Logros Completados

- **Aplicación base**: React + Router + Vite funcionando
- **Estructura UI**: Layout de 3 paneles (navegación, central, detalles)
- **Providers básicos funcionando**:
  - ThemeProvider ✅
  - QueryProvider ✅
  - CacheProvider ✅
  - SimpleSettingsProvider ✅ (temporal)
  - SimpleFileProvider ✅ (temporal)

### ⚠️ Problemas Identificados

1. **SettingsProvider real**: Falla por dependencia de `profileClient`
2. **FileProvider real**: Dependencias complejas causan loops infinitos
3. **MainLayout original**: Depende de stores Zustand no inicializados
4. **Componentes reales**: NavPanel, ViewContainer, etc. necesitan contextos completos

---

## 🎯 FASE 1: Arreglar Providers Fundamentales

### 1.1 Investigar y Arreglar SettingsProvider

**Objetivo**: Hacer funcionar SettingsProvider sin `profileClient`

**Problemas detectados**:

- `profileClient` tiene dependencias de base de datos
- Calls async que pueden estar fallando silenciosamente
- Dependencias circulares posibles

**Plan de acción**:

```bash
# 1. Analizar dependencias de profileClient
grep -r "profileClient" src/services/profile/
grep -r "import.*profile" src/lib/contexts/settings-context.tsx

# 2. Crear versión temporal sin profileClient
# 3. Probar SettingsProvider sin profiles
# 4. Integrar gradualmente funcionalidad de profiles
```

**Criterios de éxito**:

- [ ] SettingsProvider carga sin errores
- [ ] Configuraciones básicas funcionan (theme, language, etc.)
- [ ] localStorage persiste configuraciones
- [ ] No hay loops infinitos

### 1.2 Investigar y Arreglar FileProvider

**Objetivo**: Hacer funcionar FileProvider sin dependencias problemáticas

**Problemas detectados**:

- `clientEvents.useEvents` puede estar causando loops
- `logActivity` server action puede fallar
- Estado inicial complejo

**Plan de acción**:

```bash
# 1. Analizar dependencias de FileProvider
grep -r "clientEvents" src/lib/contexts/file-context.tsx
grep -r "logActivity" src/lib/contexts/file-context.tsx

# 2. Crear versión sin clientEvents
# 3. Probar FileProvider básico
# 4. Integrar gradualmente eventos y logging
```

**Criterios de éxito**:

- [ ] FileProvider carga sin errores
- [ ] Estado básico de archivos funciona
- [ ] Selección de archivos funciona
- [ ] No hay loops infinitos

---

## 🎯 FASE 2: Integrar Stores de Zustand

### 2.1 Investigar Stores Problemáticos

**Objetivo**: Identificar qué stores necesita MainLayout

**Stores detectados en MainLayout**:

- `useImageViewer` - Para visor de imágenes
- `useDetailsPanel` - Para panel de detalles

**Plan de acción**:

```bash
# 1. Analizar dependencias de cada store
grep -r "useImageViewer" src/store/
grep -r "useDetailsPanel" src/store/

# 2. Verificar inicialización de stores
# 3. Probar stores individualmente
# 4. Integrar en MainLayout gradualmente
```

**Criterios de éxito**:

- [ ] Stores se inicializan correctamente
- [ ] No hay dependencias circulares
- [ ] Estado inicial es válido
- [ ] MainLayout puede usar stores sin errores

### 2.2 Probar MainLayout Real

**Objetivo**: Hacer funcionar MainLayout original con todos los providers

**Plan de acción**:

1. Reemplazar SimpleProviders con providers reales
2. Probar MainLayout paso a paso
3. Identificar errores específicos
4. Arreglar dependencias una por una

**Criterios de éxito**:

- [ ] MainLayout se renderiza sin errores
- [ ] Paneles se muestran correctamente
- [ ] No hay loops infinitos
- [ ] Resizable panels funcionan

---

## 🎯 FASE 3: Integrar Componentes Reales

### 3.1 NavPanel Real

**Objetivo**: Reemplazar panel de navegación simulado con NavPanel real

**Dependencias de NavPanel**:

- `getNavigationData` action
- Contextos de archivos y configuración
- Posibles stores de navegación

**Plan de acción**:

1. Analizar dependencias de NavPanel
2. Verificar que `getNavigationData` funciona
3. Probar NavPanel aislado
4. Integrar en MainLayout

**Criterios de éxito**:

- [ ] NavPanel se renderiza correctamente
- [ ] Datos de navegación cargan
- [ ] Navegación entre secciones funciona
- [ ] No hay errores de rendering

### 3.2 ViewToolbar Real

**Objetivo**: Reemplazar toolbar simulado con ViewToolbar real

**Plan de acción**:

1. Analizar dependencias de ViewToolbar
2. Verificar actions de toolbar
3. Probar toolbar aislado
4. Integrar funcionalidad real

**Criterios de éxito**:

- [ ] Toolbar se renderiza correctamente
- [ ] Botones funcionan
- [ ] Estados se actualizan correctamente

### 3.3 ViewContainer Real

**Objetivo**: Reemplazar contenido central con ViewContainer real

**Dependencias críticas**:

- Stores de vistas
- Componentes de vistas (FileBrowser, etc.)
- Gestión de estado de archivos

**Plan de acción**:

1. Analizar ViewContainer y sus dependencias
2. Verificar que vistas individuales funcionan
3. Probar ViewContainer aislado
4. Integrar navegación entre vistas

**Criterios de éxito**:

- [ ] ViewContainer se renderiza
- [ ] Vistas se cargan correctamente
- [ ] Navegación entre vistas funciona
- [ ] Rendimiento es aceptable

### 3.4 RightPanel Real

**Objetivo**: Reemplazar panel de detalles con RightPanel real

**Plan de acción**:

1. Analizar RightPanel y dependencias
2. Verificar stores de detalles
3. Probar panel aislado
4. Integrar con selección de archivos

**Criterios de éxito**:

- [ ] RightPanel se renderiza
- [ ] Detalles se muestran correctamente
- [ ] Actualización en tiempo real funciona

---

## 🎯 FASE 4: Restaurar Funcionalidad Completa

### 4.1 Gestión de Archivos

**Objetivo**: Restaurar funcionalidad completa de gestión de archivos

**Funcionalidades clave**:

- Carga de archivos
- Navegación por carpetas
- Búsqueda y filtrado
- Operaciones CRUD

**Plan de acción**:

1. Verificar server actions funcionan
2. Probar carga de datos
3. Verificar operaciones de archivos
4. Integrar con UI

### 4.2 Sistema de Vistas

**Objetivo**: Restaurar todas las vistas y navegación

**Vistas principales**:

- AllImagesView
- FoldersView
- AlbumsView
- FavoritesView
- Etc.

**Plan de acción**:

1. Probar cada vista individualmente
2. Verificar datos se cargan
3. Probar navegación entre vistas
4. Verificar rendimiento

### 4.3 Funcionalidades Avanzadas

**Objetivo**: Restaurar funcionalidades específicas

**Funcionalidades**:

- Image viewer
- Upload system
- Search system
- Settings system
- Collections/tags/characters

---

## 📋 Metodología de Trabajo

### Principios de Desarrollo

1. **Incremental**: Un cambio a la vez
2. **Verificación**: Probar cada cambio antes del siguiente
3. **Rollback**: Mantener versión funcionando en cada paso
4. **Documentación**: Registrar cada problema y solución

### Proceso por Fase

```bash
# Para cada tarea:
1. Analizar dependencias
2. Crear versión aislada/simplificada
3. Probar funcionamiento
4. Integrar gradualmente
5. Verificar no hay regresiones
6. Documentar solución
```

### Herramientas de Diagnóstico

```bash
# Verificar errores TypeScript
pnpm tsc --noEmit

# Verificar errores de linting
pnpm biome check

# Verificar logs de aplicación
pnpm logs list

# Verificar errores específicos
pnpm check:errors
```

---

## 🚨 Criterios de Emergencia

### Rollback Inmediato Si

- Aplicación no carga (pantalla en blanco)
- Loops infinitos detectados
- Errores críticos en consola
- Pérdida de funcionalidad básica

### Puntos de Control

- [ ] **Checkpoint 1**: Providers reales funcionando
- [ ] **Checkpoint 2**: MainLayout real funcionando
- [ ] **Checkpoint 3**: Componentes básicos funcionando
- [ ] **Checkpoint 4**: Funcionalidad completa restaurada

---

## 📊 Métricas de Éxito

### Técnicas

- 0 errores TypeScript críticos
- 0 errores de runtime en consola
- Tiempo de carga < 3 segundos
- Sin memory leaks detectados

### Funcionales

- Todas las vistas cargan correctamente
- Navegación fluida entre secciones
- Operaciones de archivos funcionan
- Settings persisten correctamente

### UX

- Interfaz responsive
- Feedback visual apropiado
- Performance aceptable
- Funcionalidad completa restaurada

---

## 🎯 SIGUIENTE PASO INMEDIATO

**Empezar con FASE 1.1**: Investigar y arreglar SettingsProvider

```bash
# Comando inicial para análisis
grep -r "profileClient" src/services/profile/ | head -10
```

Este plan nos permitirá restaurar la funcionalidad paso a paso de manera controlada y documentada.
