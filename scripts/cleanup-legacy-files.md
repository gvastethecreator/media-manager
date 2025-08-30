# Cleanup Legacy Files

Los siguientes archivos legacy deben eliminarse ya que no se usan más:

## Archivos a eliminar

```bash
# Navegar a la carpeta del proyecto
cd d:\DEV\image-manager

# Eliminar archivos legacy del file-browser
rm -rf src/components/features/file-browser/views/legacy/
```

### Lista de archivos legacy específicos:

- `src/components/features/file-browser/views/legacy/file-cards.tsx`
- `src/components/features/file-browser/views/legacy/file-context-menu.tsx`
- `src/components/features/file-browser/views/legacy/file-grid.tsx`
- `src/components/features/file-browser/views/legacy/file-list-header.tsx`
- `src/components/features/file-browser/views/legacy/file-list.tsx`
- `src/components/features/file-browser/views/legacy/file-masonry.tsx`
- `src/components/features/file-browser/views/legacy/file-single.tsx`
- `src/components/features/file-browser/views/legacy/file-table.tsx`

## Verificación

Después de eliminar, verificar que no hay referencias:

```bash
# Buscar referencias faltantes
grep -r "legacy" src/ --include="*.ts" --include="*.tsx"
grep -r "file-table\|file-grid\|file-cards" src/ --include="*.ts" --include="*.tsx"
```

## Razón

Estos archivos fueron reemplazados por las versiones canvas optimizadas y ya no se utilizan en ninguna parte del código.