# TODO: FIX-JSX-001 - Corregir errores JSX en collections-settings.tsx

**STATUS:** EN_PROGRESO
**PRIORIDAD:** CRÍTICA
**ARCHIVO:** `src/components/settings/collections/collections-settings.tsx`
**ERROR:** JSX element 'CardContent' has no corresponding closing tag (línea 318)

## PROBLEMA IDENTIFICADO:
- Código duplicado y malformado entre líneas 310-370
- Múltiples etiquetas `</ScrollArea>` sin apertura correspondiente
- Fragmentos de código JSX repetidos que rompen la estructura
- Etiquetas `CardContent` y `Card` mal anidadas

## SUBTASKS:
```markdown
- [✅] Analizar estructura JSX actual del archivo
- [✅] Eliminar código duplicado entre líneas 310-370
- [✅] Restaurar estructura JSX correcta
- [✅] Validar sintaxis JSX
- [✅] Verificar compilación sin errores
- [✅] Probar funcionalidad del componente
```

## CRITERIOS DE ACEPTACIÓN:
- [ ] Archivo compila sin errores JSX
- [ ] Estructura de etiquetas correctamente anidada
- [ ] Funcionalidad del componente preservada
- [ ] No hay código duplicado
- [ ] Tests pasan (si existen)

## VALIDACIÓN:
- [ ] TypeScript compila sin errores
- [ ] Linter no reporta problemas
- [ ] Componente renderiza correctamente
- [ ] Funcionalidad de filtros y edición funciona

## NOTAS:
- El problema está causado por duplicación accidental de código
- Se debe preservar toda la funcionalidad existente
- Revisar que no haya otros archivos con problemas similares

---
**CREADO:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**ACTUALIZADO:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')