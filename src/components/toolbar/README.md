# Toolbar Principal

Barra de herramientas ubicada en la parte superior de la aplicación.
Gestiona las acciones masivas sobre archivos y controla el modo de
visualización.

- **main-toolbar.tsx**: Contiene botones de acción generales.
- **entity-details.tsx**: Muestra información de la entidad seleccionada.

La toolbar lee el modo de vista y orden desde el slice `view-options` y
obtiene la selección de archivos desde `selection.store`. De esta forma,
FileBrowser y toolbar comparten estado sin acoplarse.

Estos componentes suelen ser Server Components y se integran con el layout principal.
