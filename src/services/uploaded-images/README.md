# 📸 Servicio de Imágenes Subidas

Este servicio maneja la gestión de imágenes subidas por los usuarios a la plataforma.

## 🔧 Funcionalidades

- Creación, actualización y eliminación de imágenes subidas
- Búsqueda y filtrado de imágenes por diversos criterios
- Procesamiento de imágenes (compresión, redimensionamiento, etc.)
- Gestión de metadatos de imágenes

## 🔄 Integración

El servicio se utiliza principalmente desde los Server Actions relacionados con imágenes subidas:

```typescript
import { uploadedImagesService } from '@/services/uploaded-images';

// Crear una nueva imagen subida
const result = await uploadedImagesService.createUploadedImage({
  name: 'mi-imagen.jpg',
  path: '/uploads/mi-imagen.jpg',
  type: 'thumbnail',
  category: 'user',
  // ...más parámetros
});
```

## ⚙️ Estructura

- `uploaded-images.service.ts`: Implementación principal del servicio
- `index.ts`: Punto de entrada y exportaciones
