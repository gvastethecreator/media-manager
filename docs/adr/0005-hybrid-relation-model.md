---
status: accepted
---

# Modelo híbrido de relaciones

La arquitectura objetivo no seguirá ni un extremo de tablas específicas por cada par de entidades, ni un extremo de relación totalmente genérica para absolutamente todo. Se adopta un **modelo híbrido**: las relaciones semánticas transversales entre objetos del dominio pueden usar una representación genérica con `Relation Role` opcional, mientras que las relaciones estructurales fuertes conservan contratos y persistencia dedicados.

## Decisión

- Las relaciones semánticas cross-context pueden converger hacia un modelo genérico.
- Ese modelo puede llevar un `Relation Role` opcional cuando el vínculo necesite significado explícito.
- Las relaciones estructurales fuertes no se absorben en la capa genérica.
- Containment, ownership, specialization y otras estructuras fundacionales mantienen modelado dedicado.

## Ejemplos

### Genéricas

- `Asset` ↔ `Narrative Entity`
- `Prompt` ↔ `Asset`
- `Group` ↔ `Organizer`
- `Note` ↔ objetos de dominio diversos

### Dedicadas

- `Folder` contiene `Assets`
- `Asset` se expresa mediante especializaciones
- `Favorite` vive como relación transversal canónica propia
- otras relaciones con restricciones estructurales fuertes

## Consecuencias

- Se reduce la explosión combinatoria de join tables por cada par posible.
- Se preservan límites y restricciones en relaciones que realmente estructuran el dominio.
- El diseño de API puede converger en endpoints menos hiper-específicos para vínculos semánticos.
- La migración debe distinguir cuidadosamente entre relación semántica y relación estructural antes de unificar nada.
