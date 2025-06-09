# Zustand Stores

La carpeta `store` centraliza el estado global de la aplicación mediante
Zustand. Cada entidad tiene su propio subdirectorio dentro de `entities/` con
slices que conforman un store unificado.

```
store/
├── base.store.ts        # configuración común
├── entities/            # stores por entidad
│   └── folder/          # ejemplo de entidad
└── store.factory.ts     # helpers para crear stores
```

Los selectores se encuentran en cada `store.ts` para facilitar el acceso
memorizado desde los componentes.
