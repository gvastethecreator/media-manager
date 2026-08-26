# Reindex logs viewer

This module contains the `ReindexLogsViewer` component.

The component shows reindex errors and warnings in real time.

Exposed UI route: `/admin/reindex` (through React Router)

The viewer depends on the following server endpoints:

- `GET /api/reindex-logs/stats`
- `GET /api/reindex-logs/errors` (param `limit`)
- `GET /api/reindex-logs/warnings` (param `limit`)
- `GET /api/reindex-logs/recent` (param `limit`)
- `GET /api/reindex-logs/summary` (param `days`)
- `POST /api/reindex-logs/cleanup`
