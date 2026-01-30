# Documentación de Transformadores de Profile

## Descripción

Los transformadores de **Profile** permiten mapear, serializar, deserializar y extender la entidad Profile para distintos usos (UI, API, persistencia, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Profile (Drizzle/Raw)] --> B[profile-transformers.ts]
    B -->|toProfileListItem| C[ProfileListItem]
    B -->|toProfileCard| D[ProfileCard]
    B -->|parseProfileSearchParams| E[Drizzle.ProfileWhereInput]
```

---

## Estructura y Relaciones

- **profile-transformers.ts**: Mapeo, serialización y validación.
- **index.ts**: Barrel limpio, solo exporta funciones y tipos canónicos.

---

## Ejemplo de Uso

```typescript
import { toProfileListItem } from '@/transformers/profile/profile-transformers';

const listItem = toProfileListItem(rawProfile);
```

---

## Buenas Prácticas

- Usar **solo** los tipos y funciones canónicas exportadas.
- No modificar los tipos base ni duplicar lógica de transformación.
- Validar siempre los datos con los esquemas y funciones provistas.
- Mantener el barrel (`index.ts`) limpio y sin duplicados.

---

## Notas

- Todos los mapeos gestionan errores y validaciones de forma robusta.
- No existen tipos legacy ni duplicados en este módulo.

---

## Última revisión

- Fecha: 2025-06-10
- Estado: ✅ Auditado, sin errores TS, documentación y diagramas actualizados.
