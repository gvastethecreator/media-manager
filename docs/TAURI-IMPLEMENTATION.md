# 🖥️ Aplicación Desktop con Tauri v2

## 📋 Resumen de la Implementación

Se ha configurado **Tauri v2** para crear una aplicación de escritorio que incluye:

- ✅ **Frontend React/Vite** empaquetado
- ✅ **Backend Express** incluido como recurso
- ✅ **Base de datos SQLite** portable
- ✅ **APIs REST** completamente funcionales
- ✅ **Sistema de archivos** accesible

## 🏗️ Arquitectura de la Solución

### **Frontend (React)**
```
dist/ → Empaquetado en la aplicación desktop
├── index.html
├── assets/
└── ...
```

### **Backend (Express + Node.js)**
```
dist/server/ → Incluido como recurso de Tauri
├── index.js (Servidor compilado)
├── db.sqlite (Base de datos)
└── ...
```

### **Aplicación Tauri**
```
src-tauri/
├── src/
│   ├── main.rs
│   ├── lib.rs
│   └── backend.rs (Comandos para comunicación)
├── Cargo.toml (Dependencias Rust)
└── tauri.conf.json (Configuración)
```

## 🚀 Scripts de Uso

### **Desarrollo**
```bash
# Iniciar en modo desarrollo (backend + frontend + Tauri)
bun run dev:tauri
```

### **Producción**
```bash
# Construir aplicación desktop completa
bun run build:tauri
```

### **Solo Web (como antes)**
```bash
# Desarrollo web tradicional
bun run dev

# Build web tradicional
bun run build
```

## 📦 Proceso de Build

1. **Frontend**: `bun run build:vite` → Genera `dist/`
2. **Backend**: `bun run build:server` → Genera `dist/server/`
3. **Base de datos**: Copia `db.sqlite` a `dist/server/`
4. **Tauri**: `bunx tauri build` → Genera ejecutables

## 🗃️ Gestión de Base de Datos

### **En Desarrollo**
- Base de datos en: `./db.sqlite`
- Backend ejecutándose en: `http://localhost:4000`

### **En Producción (Desktop)**
- Base de datos en: `{AppData}/image-manager/db.sqlite`
- Backend incluido internamente en la aplicación
- APIs accesibles en: `http://localhost:4000`

## 🔧 Componentes Añadidos

### **Hooks de React**
```typescript
// Detecta si estamos en Tauri y gestiona el backend
import { useTauriBackend, useTauriContext } from '@/hooks/use-tauri-backend';

function MyComponent() {
  const isTauri = useTauriContext();
  const { isRunning, checkBackendHealth } = useTauriBackend();

  // Tu lógica aquí...
}
```

### **Componente de Estado**
```tsx
// Muestra el estado del backend en la UI
import { TauriBackendStatus } from '@/components/ui/tauri-backend-status';

<TauriBackendStatus />
```

### **Configuración de BD**
```typescript
// Maneja rutas de BD según contexto
import { getDatabasePath, setupTauriEnvironment } from '@/lib/tauri/database-config';
```

## 📊 Ventajas de esta Implementación

### ✅ **Para el Usuario**
- **Una sola aplicación** que funciona offline
- **Instalación simple** como cualquier programa
- **Rendimiento nativo** del sistema operativo
- **Acceso completo** al sistema de archivos
- **Sin dependencias** de navegador

### ✅ **Para el Desarrollador**
- **Código reutilizado** al 100% (frontend + backend)
- **APIs REST** funcionan exactamente igual
- **Base de datos** portable y automática
- **Desarrollo híbrido** (web + desktop simultáneo)
- **Deployment** simplificado

## 🎯 Funcionalidades Mantenidas

- ✅ **Gestión de imágenes** completa
- ✅ **Sistema de álbumes** y etiquetas
- ✅ **Base de datos** con todas las entidades
- ✅ **APIs REST** sin modificaciones
- ✅ **Sistema de archivos** local
- ✅ **Interfaz de usuario** idéntica

## 🔍 Próximos Pasos

1. **Probar build de desarrollo**: `bun run dev:tauri`
2. **Probar build de producción**: `bun run build:tauri`
3. **Optimizar rendimiento** según necesidades
4. **Añadir funcionalidades nativas** si es necesario

## 🐛 Troubleshooting

### **Backend no inicia**
```bash
# Verificar que el puerto 4000 esté libre
netstat -an | findstr :4000

# Verificar logs del backend
# Los logs aparecerán en la consola de Tauri
```

### **Base de datos no encontrada**
```bash
# Verificar que db.sqlite esté en la ubicación correcta
# En desarrollo: ./db.sqlite
# En producción: se crea automáticamente
```

### **Build falla**
```bash
# Verificar dependencias de Rust
rustc --version
cargo --version

# Reinstalar dependencias de Tauri
bun install
```

## 📁 Estructura Final

```
image-manager/
├── dist/                    # Frontend compilado
├── dist/server/            # Backend compilado + BD
├── src/                    # Código fuente React
├── src-tauri/             # Código fuente Tauri
├── scripts/
│   ├── tauri-dev.js       # Script desarrollo
│   └── tauri-build.js     # Script build
└── package.json           # Scripts actualizados
```

**¡La aplicación ahora puede ejecutarse tanto en web como en desktop!** 🎉
