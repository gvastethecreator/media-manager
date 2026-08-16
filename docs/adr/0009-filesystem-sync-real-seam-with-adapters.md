---
status: accepted
---

# FileSystemSync como seam real con adapters explícitos

`FileSystemSync` dejará de ser una interface nominal y pasará a ser un seam real con adapters explícitos (scanner/persistence en producción y al menos un adapter in-memory para tests). Esta decisión concentra implementation de reconciliación FS/DB en un module profundo, mejora leverage para callers y refuerza locality al eliminar lógica dispersa entre `file-sync` y `folder-sync`.
