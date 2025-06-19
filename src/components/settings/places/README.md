# 📄 Settings de Lugares (`places-settings.tsx`)

## 🏞️ Migración a Tipos Canónicos
Este módulo ha sido migrado en junio 2024 para usar exclusivamente el tipo canónico `PlaceComplete`, eliminando cualquier referencia legacy a `Place` o `PlaceWithStats`. Esto garantiza consistencia, type safety y compatibilidad futura.

## 📚 Estructura y Flujo Principal
- **Carga de lugares:** Se obtienen todos los lugares usando el action `getPlaces` y se almacenan en el estado como `PlaceComplete[]`.
- **Selección y edición:** Al seleccionar un lugar, se muestra el detalle y se puede editar usando el formulario canónico.
- **Creación y actualización:** Los handlers usan siempre `PlaceComplete` y actualizan el estado global tras cada operación.
- **Eliminación:** El handler elimina el lugar y actualiza el estado.

## 🔗 Diagrama de Relaciones
```mermaid
graph TD
    A[places-settings.tsx] -->|usa| B(PlaceComplete)
    A -->|renderiza| C(CreatePlaceForm)
    A -->|renderiza| D(DetalleLugar)
    B -->|define| E(Propiedades extendidas)
```

## 🧩 Ejemplo de Uso
```tsx
<PlacesSettings />
```

## 🚦 Notas
- Todos los datos y props usan `PlaceComplete`.
- Se eliminó cualquier import o type assertion legacy.
- Documentación y migración conforme a las reglas del workspace.

---
_Actualizado: junio 2024_