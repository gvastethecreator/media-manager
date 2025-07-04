# 🔄 Plan de Migración: Server Actions → API Calls

**Fecha**: 3 de julio de 2025
**Objetivo**: Migrar completamente de server actions de Next.js a API calls para arquitectura Vite + React + Drizzle

---

## 📊 Estado Actual Detectado

### ✅ **Infraestructura Existente**

- **Servidor Express** completo con rutas API en `src/server/`
- **33+ rutas API** ya implementadas para todas las entidades
- **Servicios Drizzle** funcionando al 96% (24/25 migrados)
- **Stores Zustand** con lógica de estado unificada
- **TanStack Query** preparado para manejo de datos asíncronos

### ❌ **Dependencias Legacy**

- **51+ archivos con `'use server'`** en `src/app/actions/`
- **Server actions** siendo llamadas desde stores Zustand
- **Componentes** usando server actions directamente
- **Hooks personalizados** mezclando server actions y API calls

---

## 🎯 Estrategia de Migración

### **Fase 1: Análisis y Preparación** ⏱️ 1-2 horas

1. **Mapeo completo** de server actions vs rutas API existentes
2. **Creación de servicio API** centralizado con TypeScript
3. **Configuración de interceptores** para logging y error handling
4. **Setup de tipos** para requests/responses

### **Fase 2: Migración por Entidades** ⏱️ 3-4 horas

1. **Entidades críticas primero**: images, folders, tags, albums
2. **Entidades secundarias**: characters, places, concepts, etc.
3. **Entidades utilitarias**: stats, search, metadata, system

### **Fase 3: Limpieza Completa** ⏱️ 1 hora

1. **Eliminación masiva** de archivos `*.actions.ts`
2. **Actualización de imports** en componentes y hooks
3. **Validación de funcionalidad** con Playwright MCP
4. **Optimización final** de bundles

---

## 🔧 Implementación Técnica

### **1. Servicio API Centralizado**

```typescript
// src/lib/api/client.ts
export class ApiClient {
  private baseURL = 'http://localhost:3001';

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // PUT, DELETE, etc.
}
```

### **2. Servicios por Entidad**

```typescript
// src/lib/api/services/concepts.ts
export const conceptsApi = {
  getAll: () => apiClient.get<ConceptWithStats[]>('/api/concepts'),
  getById: (id: string) => apiClient.get<ConceptWithStats>(`/api/concepts/${id}`),
  create: (data: ConceptCreateInput) => apiClient.post<ConceptWithStats>('/api/concepts', data),
  update: (id: string, data: ConceptUpdateInput) => apiClient.put<ConceptWithStats>(`/api/concepts/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/concepts/${id}`),
};
```

### **3. Actualización de Stores**

```typescript
// src/store/entities/concept/index.ts
const createCoreSlice: StateCreator<ConceptStore> = (set, get) => ({
  loadConcepts: async () => {
    set({ isLoading: true, error: null });
    try {
      // ❌ BEFORE: const concepts = await getConceptsAction({});
      // ✅ AFTER:
      const concepts = await conceptsApi.getAll();
      set({ concepts, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  // ...resto de acciones
});
```

### **4. Hooks con TanStack Query**

```typescript
// src/lib/hooks/entities/concept/use-concepts.ts
export function useConcepts() {
  const { data: concepts, isLoading, error } = useQuery({
    queryKey: ['concepts'],
    queryFn: () => conceptsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return { concepts, isLoading, error };
}
```

---

## 📋 Checklist de Migración

### **Pre-migración**

- [ ] ✅ Confirmar que servidor Express está funcionando
- [ ] ✅ Verificar todas las rutas API disponibles
- [ ] ⏳ Crear servicio API client centralizado
- [ ] ⏳ Configurar interceptors y error handling
- [ ] ⏳ Preparar tipos TypeScript para API responses

### **Por cada entidad:**

- [ ] ⏳ Mapear server actions → endpoints API
- [ ] ⏳ Actualizar store Zustand
- [ ] ⏳ Migrar hooks personalizados
- [ ] ⏳ Actualizar componentes que usen server actions directamente
- [ ] ⏳ Probar funcionalidad con Playwright MCP
- [ ] ⏳ Eliminar archivos `*.actions.ts` correspondientes

### **Post-migración**

- [ ] ⏳ Eliminar carpeta `src/app/actions/` completa
- [ ] ⏳ Limpiar imports de server actions
- [ ] ⏳ Verificar que no queden referencias a `'use server'`
- [ ] ⏳ Actualizar documentación y README
- [ ] ⏳ Ejecutar suite completa de tests E2E

---

## 🚨 Riesgos y Contingencias

### **Riesgos Identificados**

1. **Breaking changes** en componentes críticos
2. **Pérdida de funcionalidad** en operaciones CRUD
3. **Problemas de tipos** TypeScript durante la transición
4. **Inconsistencias** entre API responses y server actions

### **Plan de Contingencia**

1. **Migración incremental** por entidad, no todo de una vez
2. **Rollback preparado** manteniendo server actions temporalmente
3. **Testing continuo** con Playwright MCP en cada paso
4. **Logs detallados** para identificar problemas rápidamente

---

## ⚡ Comandos de Migración

### **Iniciar migración**

```bash
# 1. Verificar estado actual
pnpm dev  # Servidor en puerto 5173
# Server Express debería estar en 3001

# 2. Validar APIs con Playwright MCP
# browser_navigate → http://localhost:3001/health
# browser_navigate → http://localhost:3001/api/concepts
```

### **Durante migración**

```bash
# Verificar eliminar referencias a server actions
pnpm grep:search "use server" --isRegexp=false

# Verificar tipos TypeScript
pnpm tsc

# Testing continuo
pnpm test:e2e --headed
```

### **Post-migración**

```bash
# Limpieza final
rm -rf src/app/actions/
pnpm lint --fix
pnpm build
```

---

## 📈 Métricas de Éxito

- [ ] **0 archivos** con `'use server'` en el proyecto
- [ ] **0 imports** de server actions en componentes/hooks
- [ ] **100% funcionalidad** mantenida en todas las entidades
- [ ] **Mejora en performance** al eliminar overhead de server actions
- [ ] **Bundle size** reducido sin código legacy de Next.js

---

## 🎯 Próximos Pasos

1. **IMMEDIATAMENTE**: Crear servicio API client centralizado
2. **Entidad piloto**: Migrar `concepts` como prueba de concepto
3. **Validación**: Usar Playwright MCP para confirmar funcionalidad
4. **Escalado**: Aplicar patrón a todas las entidades restantes
5. **Finalización**: Limpieza completa y optimización

---

**🔥 INICIO DE MIGRACIÓN: EJECUTAR AHORA**
