debes seguir las tareas de CURRENT-TASK.md

## Workflow para Agentes de IA: Resolución de Errores de PrismaClient en el Cliente

---

## ⚔️ Plan de Batalla: Corrección Masiva de Errores de TypeScript

Se ha iniciado una misión crítica para eliminar sistemáticamente todos los errores de TypeScript del codebase. El plan detallado, las prioridades y las checklists de seguimiento se encuentran en `CURRENT-TASK.md`.

**Objetivo:** Alcanzar cero errores de TypeScript para estabilizar el proyecto y facilitar el desarrollo futuro.

**Estrategia General:**

1. **Análisis por Entidades:** Los errores se agruparán y resolverán por entidad (ej. `Album`, `Character`, `Image`, etc.).
2. **Corrección por Capas:** Dentro de cada entidad, se seguirá un orden lógico: Tipos -> Transformadores -> Acciones/Servicios -> Stores -> Componentes.
3. **Documentación:** Toda corrección importante o cambio en la arquitectura de tipos deberá ser documentado.

---

### 🚨 Protocolo de "Ataque Quirúrgico" (Vigente)

Debido a la complejidad y a la interconexión de los errores de tipo, la estrategia de "barrido amplio" ha demostrado ser ineficaz y contraproducente.

**Nuevo Protocolo:**

1. **Foco Absoluto por Entidad:** Se trabajará en **una sola entidad** a la vez hasta dejarla completamente libre de errores.
2. **Verificación Continua por Archivo:** Después de CADA modificación, se ejecutará el compilador de TypeScript (`tsc`) sobre el archivo modificado para asegurar la corrección inmediata.
3. **Reporte de Progreso Constante:** Se informará del progreso real y medible (reducción del número de errores) tras la limpieza de cada entidad.

Este enfoque prioriza la precisión y la verificación sobre la velocidad, garantizando un progreso real y evitando regresiones.

---

➡️ **Consulta `CURRENT-TASK.md` para ver las tareas y checklists activas.**
