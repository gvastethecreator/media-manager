# Reindex Logs Viewer

Este módulo contiene el componente `ReindexLogsViewer` que muestra en tiempo real los errores y warnings del sistema de reindexado.

Ruta UI expuesta: `/admin/reindex` (via React Router)

Depende de los endpoints del servidor:
- `GET /api/reindex-logs/stats`
- `GET /api/reindex-logs/errors` (param `limit`)
- `GET /api/reindex-logs/warnings` (param `limit`)
- `GET /api/reindex-logs/recent` (param `limit`)
- `GET /api/reindex-logs/summary` (param `days`)
- `POST /api/reindex-logs/cleanup`
