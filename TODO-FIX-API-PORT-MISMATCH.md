## TODO: FIX-API-PORT-MISMATCH - Corregir discrepancia de puertos API
**STATUS:** COMPLETADO
**PRIORIDAD:** CRÍTICA

### PROBLEMA IDENTIFICADO:
- El servidor backend está ejecutándose en puerto 3001
- El cliente API está configurado para puerto 8080
- Esto causa errores ERR_CONNECTION_REFUSED en todas las llamadas API

### SUBTASKS:
- [✅] [CHECKPOINT_1] Verificar configuración actual del servidor
- [✅] [CHECKPOINT_2] Actualizar configuración del cliente API
- [✅] [CHECKPOINT_3] Validar conexión API
- [✅] [CHECKPOINT_4] Verificar funcionamiento completo

### CRITERIOS DE ACEPTACIÓN:
- [x] Cliente API conecta correctamente al servidor
- [x] Estadísticas se cargan sin errores
- [x] Navegación funciona correctamente
- [x] No hay errores de conexión en consola

### VALIDACIÓN:
- [x] Código compila y tests pasan
- [x] Frontend muestra datos reales
- [x] Logs confirman conexiones exitosas