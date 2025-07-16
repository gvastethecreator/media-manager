## TODO: CORS-001 - Corregir configuración de puertos y CORS
**STATUS:** EN_PROGRESO
**PRIORIDAD:** ALTA

### SUBTASKS:
- [🔄] [CHECKPOINT_1] Corregir configuración de CORS en servidor para usar solo puerto 5173
- [⏳] [CHECKPOINT_2] Verificar que frontend esté corriendo en puerto 5173
- [⏳] [CHECKPOINT_3] Verificar que backend esté corriendo en puerto 3001
- [⏳] [CHECKPOINT_4] Probar conectividad entre frontend y backend

### CRITERIOS DE ACEPTACIÓN:
- [ ] Servidor Express configurado para CORS con origen http://localhost:5173
- [ ] Frontend corriendo en puerto 5173
- [ ] Backend corriendo en puerto 3001
- [ ] Sin errores de CORS en consola del navegador
- [ ] Aplicación carga carpetas correctamente

### VALIDACIÓN:
- [ ] Peticiones HTTP funcionan sin errores de CORS
- [ ] Aplicación muestra contenido de carpetas
- [ ] No hay errores en consola del navegador