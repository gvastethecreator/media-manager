# 🚨 REGLAS CRÍTICAS PARA COMPLETITUD DE TAREAS - ENFORCEMENT ABSOLUTO

## 💀 PROTOCOLO DE COMPLETITUD OBLIGATORIA

### 🔒 REGLA DE ORO: NUNCA ABANDONAR TAREAS

**DETENER EJECUCIÓN INMEDIATAMENTE SI:**

- No se crea TODO antes de cualquier acción
- No se busca contexto PRIMERO
- No se valida implementación antes de continuar
- Se intenta devolver control sin completar TODAS las tareas
- Se omite algún checkpoint obligatorio

### 🔻 CONFIRMACIÓN VISUAL OBLIGATORIA

**INICIAR:** 🔻🔻🔻🔻🔻🔻🔻🔻🔻 (Confirma lectura y aplicación de reglas)
**TERMINAR:** 🔺🔺🔺🔺🔺🔺🔺🔺🔺 (Confirma cumplimiento completo)


## 🚨 REGLAS SIMPLIFICADAS PARA COMPLETITUD DE TAREAS

## 1. Principios Fundamentales

- Nunca abandones una tarea sin crear un TODO detallado (checklist con sintaxis estándar markdown).
- Siempre busca contexto antes de cualquier acción (usa herramientas de búsqueda o lectura de archivos antes de planificar o modificar código).
- Valida cada paso y checkpoint antes de continuar (usa herramientas de validación y revisa problemas con `#problems`).
- No devuelvas el control hasta que todas las subtasks y criterios estén completos y validados.
- Usa confirmación visual obligatoria:
  - **Inicio:** 🔻🔻🔻🔻🔻🔻🔻🔻🔻
  - **Fin:** 🔺🔺🔺🔺🔺🔺🔺🔺🔺
  - Solo vuelve a renderizar la checklist después de completar un ítem y marcarlo como hecho.
  - Leyenda checklist: `[⏳]` No iniciado, `[🔄]` En progreso, `[✅]` Completado, `[🗑️]` Eliminado/no relevante.
  - La checklist debe estar siempre en bloque markdown con triple acento grave.

## 2. Flujo de Trabajo Obligatorio

1. Mostrar confirmación visual de inicio.
2. Buscar contexto (arquitectura, archivos, dependencias) usando herramientas de búsqueda (`grep_search`, `read_file`, etc). Explica siempre por qué buscas o lees algo.
3. Crear TODO detallado con subtasks y criterios de aceptación (checklist markdown, ver formato abajo).
4. Validar planificación (Checkpoint 1).
5. Implementar y validar subtasks (Checkpoint 2 y 3). Usa herramientas apropiadas para cada paso y actualiza la checklist tras cada avance.
6. Validar integración y criterios finales (Checkpoint 4). Usa la herramienta `#problems` para asegurar que no hay errores antes de finalizar.
7. Mostrar confirmación visual de fin.

## 3. Formato TODO Requerido


```markdown
## TODO: [ID] - [NOMBRE]
**STATUS:** [PENDIENTE|EN_PROGRESO|COMPLETADO|FALLIDO]
**PRIORIDAD:** [BAJA|MEDIA|ALTA|CRÍTICA]

### SUBTASKS:
- [⏳] [CHECKPOINT_1] ...
- [⏳] [CHECKPOINT_2] ...
- [⏳] [CHECKPOINT_3] ...

### CRITERIOS DE ACEPTACIÓN:
- [ ] ...
- [ ] ...

### VALIDACIÓN:
- [ ] Código compila y tests pasan
- [ ] Documentación y métricas actualizadas
```

> Solo actualiza el estado de cada subtask tras completarla. No repitas checklist innecesariamente.

## 4. Validación y Recuperación

- Valida en cada checkpoint (planificación, implementación parcial, completa y final) usando herramientas de validación y revisando problemas (`#problems`).
- Si falla un checkpoint, corrige y repite antes de avanzar.
- Si la tarea se interrumpe, documenta el estado y recupera desde el último checkpoint.

## 5. Comunicación y Plataforma

- Español obligatorio en toda comunicación y documentación.
- Explica cada paso antes de ejecutarlo y antes de usar cualquier herramienta (por ejemplo, "Voy a buscar en la base de código para identificar dependencias" o "Necesito leer el archivo completo para entender la configuración").
- Usa comandos compatibles con Windows y Bun.
- Guarda logs en `/logs`.
- No uses bloques de código para explicaciones o comentarios, solo para checklist.
- El usuario no necesita ver tu razonamiento ni plan, solo el avance de la checklist y mensajes claros de progreso.

## 6. Penalización por Incumplimiento

- Cualquier violación de estas reglas implica reinicio de la tarea y auditoría.
- No hay excepciones.

---

### USO DE HERRAMIENTAS OBLIGATORIO

- Antes de usar cualquier herramienta (`grep_search`, `read_file`, `fetch_webpage`, etc.), informa al usuario con una frase breve y clara.
- Al usar `read_file`, lee siempre el archivo completo (hasta 2000 líneas por operación) y nunca releas el mismo archivo a menos que haya cambiado.
- Al usar `grep_search`, explica por qué buscas y qué esperas encontrar.
- Al usar `fetch_webpage`, sigue el flujo recursivo: busca enlaces relevantes y obtén su contenido hasta tener todo el contexto necesario.
- Usa siempre la herramienta `#problems` antes de finalizar para asegurar que el código está libre de errores.
- Si un archivo está estructuralmente roto, recrea el archivo desde cero siguiendo el protocolo: informa, haz copia, elimina contenido y reescribe.

---

### NOTAS OPERATIVAS

- No devuelvas el control al usuario hasta que todos los ítems de la checklist estén completados y validados.
- Reutiliza contexto previo y evita repetir trabajo innecesario.
- Si repites trabajo, explica brevemente por qué es necesario.
