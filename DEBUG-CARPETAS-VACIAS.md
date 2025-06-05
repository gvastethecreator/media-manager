# 🔍 DIAGNÓSTICO: PROBLEMA CARPETAS VACÍAS EN FILE-BROWSER

## 📊 ESTADO ACTUAL - 4 JUNIO 2025

### ✅ SOLUCIONES COMPLETADAS

1. **Estadísticas incorrectas** - ✅ SOLUCIONADO
2. **Thumbnails no se muestran** - ✅ SOLUCIONADO

### 🔄 PROBLEMA ACTUAL

**SÍNTOMA**: Carpetas indexadas con contenido aparecen vacías (0 imágenes) en `file-browser`

## 🔍 ANÁLISIS DEL FLUJO DE DATOS

### **FLUJO COMPLETO IDENTIFICADO**

```
1. User click en carpeta → folders-view.tsx
2. Navigation store update → navigation.store.ts
3. FolderContentView mount → folder-content-view.tsx
4. useFolderImages hook → use-folder-images.ts
5. React Query call → getFolderImages server action
6. Database query → prisma.image.findMany
7. Transform to FileItem → get-folder-images.actions.ts
8. Return to FileBrowser → file-browser.tsx
9. Render items → grid/list/masonry views
```

## 🔬 PUNTOS DE FALLO IDENTIFICADOS

### **A. PROBLEMAS DE CACHE/ESTADO**

- **React Query cache**: `staleTime: 30s`, `refetchOnMount: false`
- **Navigation store**: Possible race condition
- **Hook timing**: useEffect dependencies

### **B. PROBLEMAS DE BASE DE DATOS**

- **Relación folderId**: Images might have wrong/null folderId
- **Database consistency**: After reindexing, relations broken
- **Query filtering**: `where: { folderId }` might not match

### **C. PROBLEMAS DE TRANSFORMACIÓN**

- **FileItem conversion**: Errors in mapping process
- **Thumbnail URLs**: Not properly generated
- **Data structure**: Mismatch between expected/actual format

## 🎯 PLAN DE DIAGNÓSTICO

### **FASE 1: VERIFICAR BASE DE DATOS** 🔄

- [ ] Ejecutar query manual para verificar datos en BD
- [ ] Verificar relación image.folderId → folder.id
- [ ] Comparar conteos: folder._count vs real count

### **FASE 2: TESTEAR SERVER ACTION** 🔄

- [ ] Test directo de `getFolderImages(folderId)`
- [ ] Verificar logs del server action
- [ ] Comprobar transformación a FileItem

### **FASE 3: DEPURAR HOOK REACT QUERY** 🔄

- [ ] Verificar cache keys y invalidation
- [ ] Test con `refetchOnMount: true`
- [ ] Revisar timing de llamadas

### **FASE 4: VERIFICAR COMPONENTES** 🔄

- [ ] Props passing FolderContentView → FileBrowser
- [ ] State updates en navigation store
- [ ] Component rendering timing

## 🔧 TESTS ESPECÍFICOS A REALIZAR

### **TEST 1: Database Consistency Check**

```sql
-- Verificar carpetas con contenido vs conteo
SELECT
  f.id, f.name, f.path,
  f._count.images as folder_count,
  (SELECT COUNT(*) FROM Image i WHERE i.folderId = f.id) as real_count
FROM Folder f
WHERE f._count.images != (SELECT COUNT(*) FROM Image i WHERE i.folderId = f.id);
```

### **TEST 2: Server Action Direct Call**

```typescript
// Test directo en componente de desarrollo
const testResult = await getFolderImages('folder-id-specific');
console.log('🔍 Direct call result:', testResult);
```

### **TEST 3: React Query Cache Analysis**

```typescript
// En component, verificar cache state
const queryClient = useQueryClient();
const cacheData = queryClient.getQueryData(['folder-images', folderId]);
console.log('🔍 Cache data:', cacheData);
```

## 📝 PRÓXIMOS PASOS

1. **Ejecutar tests de diagnóstico**
2. **Identificar punto exacto de fallo**
3. **Implementar solución específica**
4. **Validar fix con casos de prueba**
5. **Actualizar documentación**

---
*Creado: 4 Junio 2025 - En investigación activa*
