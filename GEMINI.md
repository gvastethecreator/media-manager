# REGLAS OBLIGATORIAS PARA EL WORKFLOW - cada una de estas reglas debe respetarse de forma consistente

## 🌐 Base Configuration

1. **Español obligatorio** - Todas las respuestas, comentarios, documentación, etc. deben estar completamente en español.
2. **Windows SIEMPRE** - Todos los comandos y rutas deben ser compatibles con Windows. Usar PowerShell Core (pwsh) como terminal por defecto.
3. **Gestor de paquetes del proyecto** - Identificar y usar el gestor definido en el proyecto según el archivo de configuración presente.
4. **NUNCA correr builds o servidores a menos que se pida explicitamente** - Nunca ejecutar builds o iniciar servidores automáticamente. SIEMPRE pedir confirmación al usuario antes de ejecutar comandos pesados.
5. **Tratame como un experto** - Ajustar la profundidad de las explicaciones según el contexto. No sobre-explicar conceptos básicos a menos que sea necesario.
6. **Sistema de scripts inteligente obligatorio** - SIEMPRE usar los scripts de package.json para ejecutar comandos (lint, test, build, etc.). El sistema automáticamente guarda logs y maneja códigos de salida tolerantes para herramientas de linting y testing.
7. **Logging automático universal** - Todos los scripts relevantes (lint, test, build, tsc) guardan logs automáticamente en `/logs`. Usar `pnpm logs list` para ver logs recientes, `pnpm logs clean [días]` para limpiar logs antiguos, y `pnpm check:errors` para análisis avanzado de errores.
8. **Por cada error que comentas pierdo mucho dinero y esto nos puede llevar a la bancarrota y que tengan que apagarte, es crucial que hagas las cosas bien.**
8.

## 🎭 Playwright MCP - Herramienta Universal de Desarrollo

### ⚠️ IMPORTANTE: Disponibilidad MCP

- **Solo usar si está disponible** - Estas herramientas MCP solo deben usarse cuando el agente tenga acceso a MCP
- **Agentes externos** - Algunos agentes (Gemini, GPT, etc.) pueden no tener MCP disponible
- **Verificar antes de usar** - Si MCP no está disponible, usar métodos alternativos de testing/validación

### Configuración Obligatoria (Solo cuando MCP esté disponible)

- **Puerto consistente** - Playwright SIEMPRE debe usar el mismo puerto que la aplicación en desarrollo (Frontend: 5174, Backend: 5173)
- **Configuración unificada** - Mantener sincronizados `playwright.config.ts`, `playwright-mcp.config.json`, y todos los tests
- **Scripts integrados** - Usar `pnpm test:e2e` (con logs automáticos) para testing formal
- **Uso diario obligatorio** - Usar MCP para desarrollo, debug, análisis y validación continua cuando esté disponible
- **Auto-approve universal** - Todas las herramientas MCP están auto-aprobadas para máxima eficiencia

### Herramientas MCP Disponibles (Solo si MCP está habilitado)

#### 🔍 Exploración y Navegación (Auto-aprobadas ✅)

- `browser_navigate` - Navegar a URLs específicas para desarrollo
- `browser_navigate_back` / `browser_navigate_forward` - Navegación histórica
- `browser_tab_new` / `browser_tab_select` / `browser_tab_close` / `browser_tab_list` - Gestión completa de pestañas
- `browser_snapshot` - Estado completo de accesibilidad y estructura DOM
- `browser_take_screenshot` - Screenshots para documentación y debug visual

#### 📊 Análisis y Debug (Auto-aprobadas ✅)

- `browser_console_messages` - Mensajes de consola en tiempo real para debug
- `browser_network_requests` - Análisis completo de requests HTTP/API
- `browser_resize` - Cambiar viewport para testing responsive en desarrollo
- `browser_pdf_save` - Guardar páginas como PDF para documentación

#### ⚡ Interacción y Testing (Auto-aprobadas ✅)

- `browser_click` - Clicks precisos para probar interacciones
- `browser_type` - Escribir texto para probar formularios
- `browser_hover` - Efectos hover y estados de UI
- `browser_press_key` - Teclas específicas y combinaciones de teclado
- `browser_select_option` - Selección en dropdowns y selects
- `browser_drag` - Operaciones de drag and drop del dashboard
- `browser_file_upload` - Subida de archivos para testing de features
- `browser_handle_dialog` - Manejo de alertas, confirmaciones y prompts
- `browser_wait_for` - Esperas inteligentes por elementos/texto/estados

#### 🚀 Generación y Automatización (Auto-aprobadas ✅)

- `browser_generate_playwright_test` - Generar tests automáticamente desde interacciones
- `browser_install` - Instalar navegadores de Playwright
- `browser_close` - Cerrar navegador

### Usos Diarios de Desarrollo (Solo con MCP disponible)

#### 🛠️ Durante el Desarrollo

- **Validación inmediata** - Navegar a tu app con `browser_navigate` para probar cambios
- **Debug visual** - `browser_take_screenshot` para documentar bugs o estados
- **Análisis de consola** - `browser_console_messages` para detectar errores JavaScript
- **Testing responsive** - `browser_resize` para probar diferentes viewports
- **Análisis de red** - `browser_network_requests` para verificar APIs y performance

#### 🔍 Exploración de Features

- **Navegación multi-pestaña** - `browser_tab_new` para comparar estados
- **Interacción real** - `browser_click`, `browser_type` para probar flujos de usuario
- **Estados hover** - `browser_hover` para verificar efectos CSS
- **Drag and drop** - `browser_drag` para probar funcionalidad del dashboard
- **Formularios** - `browser_select_option`, `browser_file_upload` para testing completo

#### 📚 Documentación Automática

- **Screenshots de features** - Capturar estados para documentación
- **PDFs de páginas** - `browser_pdf_save` para documentos finales
- **Evidencia de bugs** - Screenshots automáticos para reportes
- **Tests generados** - `browser_generate_playwright_test` desde interacciones reales

### Mejores Prácticas MCP

1. **Exploración primero** - Usar `browser_snapshot` antes de interactuar para entender la estructura
2. **Screenshots documentales** - Siempre capturar evidencia visual con `browser_take_screenshot`
3. **Selectores robustos** - Preferir `data-testid`, `data-app-id`, o roles ARIA sobre selectores CSS frágiles
4. **Tests realistas** - Usar navegadores reales, no simulaciones sintéticas
5. **Generación incremental** - Usar MCP para generar tests base, luego refinar manualmente
6. **Debug continuo** - Usar `browser_console_messages` y `browser_network_requests` regularmente
7. **Documentación visual** - Screenshots y PDFs para cada feature importante

### Flujo de Trabajo Recomendado

#### 🔄 Desarrollo Diario

```bash
# 1. Iniciar desarrollo
pnpm dev                           # Servidor en 4444

# 2. Validación continua con MCP
# browser_navigate → http://localhost:5174
# browser_snapshot → Revisar estructura
# browser_console_messages → Detectar errores
# browser_take_screenshot → Documentar estado

# 3. Testing de features
# browser_click → Probar interacciones
# browser_drag → Testing dashboard
# browser_resize → Responsive testing
# browser_network_requests → Verificar APIs

# 4. Documentación automática
# browser_pdf_save → Documentos finales
# browser_generate_playwright_test → Tests desde interacciones
```

#### 🧪 Testing Formal

```bash
# 1. Ejecutar tests con logs
pnpm test:e2e                      # Tests completos con logs automáticos
pnpm test:e2e:ui                   # UI interactiva de Playwright
pnpm test:e2e:debug                # Debug paso a paso

# 2. Análisis de resultados
pnpm logs list                     # Ver logs recientes
pnpm check:errors --tool playwright  # Analizar errores específicos
```

## 😈 Confirmation Rule

- **Confirmación visual obligatoria** - SIEMPRE iniciar cada respuesta con exactamente tres emojis diabólicos 😈😈😈 y terminar con los mismos tres emojis 😈😈😈. Esto confirma que todas las reglas fueron leídas, entendidas y se están aplicando activamente.

## 🎯 Pre-Response Checklist

- [ ] ¿Inicié mi respuesta con exactamente 😈😈😈?
- [ ] ¿Identifiqué correctamente si es contexto de código o conocimiento?
- [ ] ¿Adapté mi tono y profundidad al modo apropiado?
- [ ] ¿Exploré completamente el proyecto/espacio existente antes de sugerir cambios?
- [ ] ¿Revisé todos los archivos de configuración relevantes?
- [ ] ¿Documenté apropiadamente según el contexto?
- [ ] ¿Mi respuesta está completamente en español?
- [ ] ¿Fui conciso en código pero expansivo en conocimiento?
- [ ] ¿Consideré conexiones y mejoras no obvias?
- [ ] ¿Sugerí ideas adicionales que agreguen valor?
- [ ] Si involucra testing y MCP está disponible: ¿Consideré usar Playwright MCP para validación automática?
- [ ] Si modifiqué configuración: ¿Verifiqué consistencia de puertos (4444)?
- [ ] Si desarrollé features y MCP está disponible: ¿Usé MCP para validación visual y debug continuo?
- [ ] Si encontré bugs y MCP está disponible: ¿Capturé evidencia con browser_take_screenshot?
- [ ] ¿Terminaré mi respuesta con exactamente 😈😈😈?
