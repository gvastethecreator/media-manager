# Hooks del FileBrowser

Este directorio contiene los hooks que gestionan la lógica interna del FileBrowser. Cada hook está enfocado en una responsabilidad específica.

- `use-grid-view`: calcula y gestiona el layout en vista de grid.
- `use-grid-virtualizer`: wrapper de virtualización con `react-virtuoso`.
- `use-thumbnail-loader`: precarga y gestiona miniaturas.
- `use-entity-loader`: utilidades para cargar entidades relacionadas.
- `use-filtered-data`: filtra y ordena los items en función del estado global de `view-options`.

```tsx
import { useFilteredData } from './hooks/use-filtered-data';

const filtered = useFilteredData(items);
```
