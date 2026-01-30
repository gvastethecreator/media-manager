# Zustand Stores

La carpeta `store` centraliza el estado global de la aplicación mediante
Zustand. Cada entidad tiene su propio subdirectorio dentro de `entities/` con
slices que conforman un store unificado.

```
store/
├── base.store.ts        # configuración común
├── entities/            # stores por entidad
│   └── folder/          # ejemplo de entidad
├── ui/                  # slices de UI compartidos
└── store.factory.ts     # helpers para crear stores
```

Los selectores se encuentran en cada `store.ts` para facilitar el acceso
memorizado desde los componentes.

## Slices destacados

- **view-options**: almacena las preferencias de visualización (vista, filtros y
  orden) con persistencia en `localStorage`.
- **selection**: centraliza la selección de archivos y es usado por la toolbar y
  el FileBrowser.
