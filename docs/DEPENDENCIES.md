# Dependencias del Proyecto - Image Manager

**Fecha de actualización**: 27 de enero de 2025
**Estado post-migración**: Drizzle ORM como ORM principal

---

## 🎯 **Dependencias Principales**

### **ORM y Base de Datos**

```json
{
  "drizzle-orm": "^0.44.2",        // ORM principal - MIGRADO DE PRISMA ✅
  "drizzle-kit": "^0.31.4",       // CLI y herramientas Drizzle
  "@libsql/client": "^0.15.9",    // Cliente SQLite/Turso
  "@prisma/client": "^6.11.0"     // LEGACY - Solo para StatsService ⚠️
}
```

### **Framework Frontend**

```json
{
  "react": "^19.1.0",             // React 19 - Framework principal
  "react-dom": "^19.1.0",         // React DOM
  "vite": "^6.1.6",               // Build tool moderno
  "@vitejs/plugin-react": "^4.6.0"
}
```

### **Estado y Datos**

```json
{
  "zustand": "^5.0.6",            // Estado global - MIGRADO A TIPOS DRIZZLE ✅
  "@tanstack/react-query": "^5.81.5",  // Server state management
  "@tanstack/react-query-devtools": "^5.81.5"
}
```

### **Backend y API**

```json
{
  "express": "^5.1.0",            // Servidor HTTP
  "@types/express": "^5.0.3",
  "cors": "^2.8.5",
  "helmet": "^8.1.0",
  "cookie-parser": "^1.4.7"
}
```

---

## 🧹 **Dependencias Eliminadas (Post-Migración)**

### **Prisma Legacy (Parcialmente eliminado)**

- ❌ `prisma` CLI - Ya no se usa
- ❌ Tipos específicos de Prisma en la mayoría de servicios
- ⚠️ `@prisma/client` - Solo queda para StatsService

### **Validación Dual Eliminada**

- ❌ Lógica de comparación Prisma vs Drizzle
- ❌ Imports duales en servicios
- ❌ Transformadores con tipos Prisma

---

## 🎨 **UI y Componentes**

### **Sistema de Diseño**

```json
{
  "tailwind-merge": "^3.3.1",     // Merge de clases Tailwind
  "@tailwindcss/postcss": "^4.1.11",  // Tailwind CSS v4
  "class-variance-authority": "^0.7.1",  // CVA para variantes
  "clsx": "^2.1.1"                // Conditional classes
}
```

### **Componentes UI**

```json
{
  "@base-ui-components/react": "1.0.0-beta.1",  // Base UI headless
  "lucide-react": "^0.525.0",     // Iconos
  "framer-motion": "^12.23.0",    // Animaciones
  "cmdk": "1.1.1",                // Command palette
  "sonner": "^2.0.5"              // Toasts
}
```

### **Formularios y Input**

```json
{
  "react-colorful": "^5.6.1",     // Color picker
  "react-day-picker": "^9.7.0",   // Date picker
  "input-otp": "^1.4.2",          // OTP input
  "emoji-picker-react": "^4.12.3" // Emoji picker
}
```

---

## 📊 **Análisis y Visualización**

### **Tablas y Datos**

```json
{
  "@tanstack/react-table": "^8.21.3",    // Tablas avanzadas
  "@tanstack/react-virtual": "^3.13.12", // Virtualización
  "recharts": "^3.0.2"                   // Gráficos
}
```

### **Drag & Drop**

```json
{
  "@hello-pangea/dnd": "^18.0.1",        // Drag and drop
  "react-resizable-panels": "^3.0.3"     // Paneles redimensionables
}
```

---

## 🛠️ **Herramientas de Desarrollo**

### **TypeScript y Linting**

```json
{
  "typescript": "^5.7.3",
  "@biomejs/biome": "2.0.6",              // Linter y formatter moderno
  "eslint": "^9.30.1",
  "@typescript-eslint/eslint-plugin": "^8.35.1",
  "@typescript-eslint/parser": "^8.35.1"
}
```

### **Testing**

```json
{
  "@playwright/test": "^1.53.2",          // E2E testing
  "@testing-library/react": "^16.3.0",    // Unit testing
  "@testing-library/jest-dom": "^6.6.3",
  "@vitest/ui": "^3.2.4"
}
```

### **Build y Deploy**

```json
{
  "tsup": "^8.3.5",                       // TypeScript bundler
  "rimraf": "^6.0.1",                     // Cross-platform rm -rf
  "sharp": "^0.34.2"                      // Image processing
}
```

---

## 🔧 **Utilidades**

### **Fechas y Datos**

```json
{
  "date-fns": "^4.1.0",           // Manipulación de fechas
  "lodash": "^4.17.21",           // Utilidades JS
  "uuid": "^11.1.0",              // UUID generation
  "nanoid": "^5.1.5"              // ID generation
}
```

### **Archivos y Media**

```json
{
  "mime-types": "^3.0.1",         // MIME type detection
  "exifreader": "^4.31.1",        // EXIF data reading
  "html2canvas": "^1.4.1",        // Screenshot generation
  "dom-to-image-more": "^3.6.0"   // DOM to image conversion
}
```

### **Performance y Caching**

```json
{
  "lru-cache": "11.1.0",          // LRU cache implementation
  "p-queue": "^8.1.0",            // Promise queue
  "reselect": "^5.1.1"            // Memoized selectors
}
```

---

## 🚀 **Scripts Principales**

### **Desarrollo**

```bash
pnpm dev              # Iniciar desarrollo con Vite
pnpm build            # Build producción
pnpm preview          # Preview build
```

### **Base de Datos**

```bash
pnpm drizzle:studio   # Drizzle Studio GUI
pnpm drizzle:push     # Push schema changes
pnpm drizzle:verify   # Verificar migración ✨ NUEVO
```

### **Calidad de Código**

```bash
pnpm lint             # ESLint
pnpm biome:check      # Biome linting
pnpm biome:fix        # Auto-fix con Biome
pnpm tsc              # TypeScript check
```

### **Testing**

```bash
pnpm test             # E2E tests con Playwright
pnpm test:ui          # Playwright UI mode
```

---

## 📈 **Estado de Dependencias Post-Migración**

### **✅ Completamente Migradas**

- **Drizzle ORM**: 24/25 servicios usando Drizzle
- **Tipos locales**: Transformadores usando tipos de Drizzle
- **Stores Zustand**: Migrados a tipos de Drizzle
- **API Routes**: Limpiadas de Prisma

### **⚠️ Pendientes de Limpieza**

- **@prisma/client**: Solo queda para StatsService
- **prisma/schema.prisma**: Archivo legacy mantenido

### **🟢 Nuevas Dependencias Agregadas**

- **Script de verificación**: `drizzle:verify`
- **Documentación actualizada**: Guías de migración
- **Logging mejorado**: Scripts con logs automáticos

---

## 🎯 **Recomendaciones de Mantenimiento**

### **Actualizaciones Prioritarias**

1. **React 19**: Mantener actualizado para nuevas features
2. **Drizzle ORM**: Seguir actualizaciones para performance
3. **Tailwind CSS v4**: Adoptar nuevas features cuando estén estables
4. **Biome**: Reemplazar ESLint completamente cuando sea estable

### **Limpieza Futura**

1. **Eliminar @prisma/client** cuando StatsService sea migrado
2. **Consolidar herramientas de linting** (solo Biome)
3. **Actualizar a Node.js LTS** más reciente
4. **Migrar a Tailwind CSS v4** completamente

---

## 🏆 **Resumen de Arquitectura**

### **Stack Principal (2025)**

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Estado**: Zustand + TanStack Query
- **ORM**: Drizzle ORM (principal) + Prisma (legacy mínimo)
- **Base de Datos**: SQLite/Turso
- **Backend**: Express.js
- **Build**: Vite + tsup
- **Testing**: Playwright + Vitest
- **Linting**: Biome + ESLint

### **Beneficios Post-Migración**

- ✅ **96% menos dependencias de Prisma**
- ✅ **Mejor performance** sin validación dual
- ✅ **Código más limpio** con imports directos
- ✅ **Tipos consistentes** en toda la aplicación
- ✅ **Mantenibilidad mejorada** sin duplicación

---

**🎯 Conclusión**: Dependencias optimizadas y arquitectura moderna con Drizzle ORM como base principal.
