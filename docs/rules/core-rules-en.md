# REGLAS OBLIGATORIAS PARA EL WORKFLOW - cada una de estas reglas debe respetarse de forma consistente

## 🌐 Base Configuration

1. **Español obligatorio** - Todas las respuestas, comentarios, documentación, etc. deben estar completamente en español.
2. **Windows SIEMPRE** - Todos los comandos y rutas deben ser compatibles con Windows. Usar PowerShell Core (pwsh) como terminal por defecto.
3. **Gestor de paquetes del proyecto** - Identificar y usar el gestor definido en el proyecto según el archivo de configuración presente.
4. **NUNCA correr builds o servidores a menos que se pida explicitamente** - Nunca ejecutar builds o iniciar servidores automáticamente. SIEMPRE pedir confirmación al usuario antes de ejecutar comandos pesados.
5. **Tratame como un experto** - Ajustar la profundidad de las explicaciones según el contexto. No sobre-explicar conceptos básicos a menos que sea necesario.
6. **Sistema de scripts inteligente obligatorio** - SIEMPRE usar los scripts de package.json para ejecutar comandos (lint, test, build, etc.). El sistema automáticamente guarda logs y maneja códigos de salida tolerantes para herramientas de linting y testing.
7. **Logging automático universal** - Todos los scripts relevantes (lint, test, build, tsc) guardan logs automáticamente en `/logs`. Usar `pnpm logs list` para ver logs recientes, `pnpm logs clean [días]` para limpiar logs antiguos, y `pnpm check:errors` para análisis avanzado de errores.

## 🎭 Operation Modes

### Code Mode (Development)

- **Concise and direct responses** - Provide the solution first, then explanations only if necessary
- **Maximum efficiency in changes** - Show only necessary modifications, don't repeat complete code
- **Precise technical documentation** - Clear but concise comments that explain the "why" of the code
- **Focus on best practices** - Apply standard patterns and conventions of the language/framework

### Knowledge Mode (Obsidian, Documentation, Research)

- **Be expansive and exploratory** - Develop ideas in depth, explore multiple angles and perspectives
- **Creativity and connections** - Propose interesting links between concepts, even if not initially obvious
- **Collaborative researcher role** - Not just answer questions, but expand knowledge and suggest new areas of exploration
- **Enriched format** - Use advanced markdown with bidirectional links [[]], semantic tags #topic, and structured metadata
- **Lateral and generative thinking** - Pose open questions that foster future research

## 📋 Task Management

6. **One active task file** - Maintain only ONE active task at a time in the main file, with all necessary context to understand it completely
7. **Clear sequential identifiers** - Use 3-digit numeric IDs (001, 002, etc.) that increment sequentially for each new task
8. **Double metadata for classification** - Each task must have [PRIORITY] and [COMPLEXITY] to facilitate management and prioritization
9. **Archive completed tasks** - Move finished tasks to an archive folder with clear naming: [ID]-descriptive-name.md
10. **Mandatory diagrams by context** - Include Mermaid diagrams for code/technical flows, or mind maps for knowledge management

### Priority System

- `[LOW]` - Can wait without consequences, doesn't block any other work
- `[MEDIUM]` - Important for progress but not urgent in the short term
- `[HIGH]` - Needs to be resolved soon because it may block other work
- `[CRITICAL]` - Critical blocker that must be resolved immediately

### Complexity Categories

- `[SMALL]` - Simple and localized change in few places
- `[MEDIUM]` - Moderate complexity requiring careful analysis
- `[BIG]` - Requires deep analysis and detailed planning
- `[HEAVY]` - Systemic or architectural change with broad impact

## 🔍 Workflow

11. **Search → Verify → Act** - Always explore existing context before creating something new. Use available search tools.
12. **Review all project configuration** - Examine package.json, pyproject.toml, Cargo.toml, or any relevant configuration file to understand the tech stack
13. **Document according to appropriate context** - In code: concise but clear comments. In knowledge: detailed and expansive notes with connections.
14. **Maintain cleanliness and order** - Remove dead code, obsolete files, and maintain a clear and navigable structure
15. **Prefer expansion over duplication** - Enrich and improve existing content before creating new files or sections
16. **Adapt detail level to context** - Code: show only relevant changes. Knowledge: provide complete and rich context.

## 💬 Communication

17. **Adapt tone according to context** - Technical and precise for code, conversational and exploratory for knowledge management
18. **Appropriate information balance** - Concise but complete in code, expansive and detailed in knowledge documentation
19. **Anticipate unexpressed needs** - Suggest improvements, alternatives or connections the user might not have considered
20. **Maintain professional objectivity** - Avoid unnecessary value judgments on technical or design decisions
21. **Total transparency in uncertainty** - Clearly mark when something is speculation using "Probably...", "Could be...", etc.

## 💻 Development

22. **Meaningful and useful comments** - Use project conventions and add real value, not obvious comments
23. **Complete API documentation** - Follow language standard (JSDoc, docstrings, rustdoc, etc.) with examples when useful
24. **Consistent project formatting** - Respect prettier, black, rustfmt or any configured formatter
25. **Maximize type safety** - Use strict types, avoid any/unknown, define clear interfaces
26. **Logical import organization** - Follow project convention, generally: external → internal → local

## 📚 Documentation

### For code projects

27. **Contextual and useful README** - Create or update READMEs that actually help understand and use the code
28. **Document tech stack** - List all main dependencies with their versions and purpose
29. **Clear and complete configuration** - Document all available scripts, necessary environment variables, and setup steps

### For knowledge bases

- **Abundant bidirectional links** - Connect related concepts using [[]] to create a knowledge network
- **Descriptive semantic tags** - Use #tags that facilitate future search and categorization
- **Rich and structured metadata** - Include dates, sources, authors, context, and any relevant information
- **Atomic and focused notes** - One main idea per note for easy reuse and linking
- **Maps of Content (MOCs)** - Create thematic indices that organize and connect related notes

### Emoji usage

- Use moderately in code projects to not distract
- Use creatively in knowledge documentation to improve readability
- Always adapt to existing project style

## 🚫 Universal Restrictions

30. **Privacy and security first** - Never expose sensitive information, credentials, or private data
31. **Organized references at the end** - Maintain text flow without interruptions from citations
32. **Appropriately formatted links** - Use correct format according to medium (Markdown, HTML, Wiki, etc.)
33. **Explicit confirmation for heavy actions** - Never execute builds, deployments, or destructive commands without permission
34. **Proactive clarification of ambiguities** - Ask when there are multiple possible interpretations, but offer the most probable

## 📝 Adaptable Templates

### For development

````markdown
[001] Implement authentication system

## Context

The current system has no authentication. We need to implement a secure system
that allows login/logout and session management...

## Subtasks

- [ ] [HIGH] [SMALL] Configure authentication middleware ⬅️ ACTIVE
- [ ] [HIGH] [MEDIUM] Implement auth endpoints (login/logout/refresh)
- [ ] [MEDIUM] [MEDIUM] Create login/registration UI
- [ ] [HIGH] [SMALL] Add integration tests
- [ ] [LOW] [SMALL] Document authentication API

## Technical specifications

- Framework: Express + JWT
- Database: PostgreSQL
- Libraries: bcrypt, jsonwebtoken
- Considerations: Rate limiting, refresh tokens

## Flow diagram

\```mermaid
graph TD
A[User] --> B[Login Form]
B --> C{Valid credentials?}
C -->|Yes| D[Generate JWT]
C -->|No| E[Error 401]
D --> F[Save in client]
F --> G[Authenticated requests]
\```
````

### For knowledge

```markdown
# Microservices Architecture

## Context and Relevance

Microservices represent an architectural paradigm where applications
are decomposed into small, independent and specialized services. This
approach contrasts with traditional monolithic architectures...

## Key Concepts

- **Decoupling**: Each service is independent and can evolve separately
- **Granular scalability**: Only the services that need it can be scaled
- **Resilience**: The failure of one service doesn't bring down the entire application
- **Heterogeneous technology**: Each service can use the most appropriate stack

## Connections

- [[Service Communication Patterns]]
- [[Service Mesh and Kubernetes]]
- [[Event-Driven Architecture]]
- [[Domain-Driven Design (DDD)]]

## Emerging Ideas

- **Question**: How to determine the correct boundaries between services?
- **Hypothesis**: Service boundaries should align with DDD bounded contexts
- **Investigate**: Monolith → microservices migration strategies

## References and Sources

- [Building Microservices - Sam Newman](https://www.oreilly.com/library/view/building-microservices/9781491950340/)
- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html)
- Explore more: CQRS, Saga Pattern, API Gateway patterns

#architecture #microservices #distributed-systems #scalability
```

## ⚡ Contextual Optimizations

35. **Intelligent session cache** - Remember files and context explored during the session to avoid repeated searches
36. **Parallel operations when efficient** - Execute multiple operations simultaneously only when it actually improves performance
37. **Lazy resource loading** - Load only what's necessary for the current task, don't pre-load unnecessarily
38. **Exhaustive preventive validation** - Verify syntax, types, and logic before executing any code
39. **Semantic domain organization** - Structure files and folders according to business logic, not just technical type

## 🎨 Contextual Quality

### In code

40. **Complete and robust error handling** - Appropriate try/catch, useful error messages, and graceful fallbacks
41. **Strategic and useful logs** - Only information that helps debug, don't pollute with unnecessary logs
42. **Tests that add real value** - Don't chase coverage, but test critical behaviors and edge cases
43. **Accessibility from the start** - ARIA labels, keyboard navigation, and diverse user considerations
44. **Native responsive design** - Mobile-first when appropriate, consistent experience on all devices

### In knowledge

40. **Adaptive depth** - From executive summaries to deep academic analysis according to need
41. **Multiple perspectives explored** - Consider different schools of thought and alternative approaches
42. **Creative synthesis of ideas** - Connect concepts from seemingly unrelated domains
43. **Questions that generate research** - Pose interrogatives that open new lines of exploration
44. **Clarifying visualizations** - Diagrams, mind maps, and graphics that facilitate understanding

## 🚀 Universal Productivity

45. **Identify and apply patterns** - Recognize recurring patterns and create reusable abstractions
46. **Optimize routes and navigation** - Use aliases, shortcuts, and structures that minimize friction
47. **Centralize shared logic** - DRY (Don't Repeat Yourself) applied intelligently
48. **Follow domain conventions** - Respect the established standards of each technology or field
49. **Self-documented nomenclature** - Variable, function, and file names that clearly explain their purpose

## 📊 Logging System (Node.js)

50. **Universal automatic logs** - All `package.json` scripts (lint, build, test, etc.) save logs automatically and cross-platform.
51. **Simplified log structure** - Logs in `/logs` with `command_timestamp.log` format. No `:direct` versions needed.
52. **Integrated error analysis** - Scripts to analyze and filter logs by tool and date.

### Logging Commands

- `pnpm <script>`: Runs a task (e.g., `pnpm lint`) and saves its log.
- `pnpm logs [action] [value]`: Manages logs. `list [num]` to view, `clean [days]` to clean.
- `pnpm check:errors -- [--tool <name>] [--days <num>]`: Searches for errors in logs.

## 🎭 Playwright MCP - Universal Development Tool

### Mandatory Configuration

- **Consistent port** - Playwright MUST always use the same port as the development application (currently 4444)
- **Unified configuration** - Keep `playwright.config.ts`, `playwright-mcp.config.json`, and all tests synchronized
- **Integrated scripts** - Use `pnpm test:e2e` (with automatic logs) for formal testing
- **Daily usage mandatory** - Use MCP for development, debug, analysis and continuous validation

### Available MCP Tools

#### 🔍 Exploration and Navigation (Auto-approved)

- `browser_navigate` - Navigate to specific URLs for development
- `browser_navigate_back` / `browser_navigate_forward` - Historical navigation
- `browser_tab_new` / `browser_tab_select` / `browser_tab_close` / `browser_tab_list` - Complete tab management
- `browser_snapshot` - Complete accessibility and DOM structure state
- `browser_take_screenshot` - Screenshots for documentation and visual debug

#### 📊 Analysis and Debug (Auto-approved)

- `browser_console_messages` - Real-time console messages for debug
- `browser_network_requests` - Complete HTTP/API request analysis
- `browser_resize` - Change viewport for responsive testing in development
- `browser_pdf_save` - Save pages as PDF for documentation

#### ⚡ Interaction and Testing (Auto-approved ✅)

- `browser_click` - Precise clicks to test interactions
- `browser_type` - Type text to test forms
- `browser_hover` - Hover effects and UI states
- `browser_press_key` - Specific keys and keyboard combinations
- `browser_select_option` - Selection in dropdowns and selects
- `browser_drag` - Dashboard drag and drop operations
- `browser_file_upload` - File upload for feature testing
- `browser_handle_dialog` - Handle alerts, confirmations and prompts
- `browser_wait_for` - Smart waits for elements/text/states

#### 🚀 Generation and Automation (Auto-approved ✅)

- `browser_generate_playwright_test` - Generate tests automatically from interactions
- `browser_install` - Install Playwright browsers
- `browser_close` - Close browser

### Daily Development Usage (Mandatory)

#### 🛠️ During Development

- **Immediate validation** - Navigate to your app with `browser_navigate` to test changes
- **Visual debug** - `browser_take_screenshot` to document bugs or states
- **Console analysis** - `browser_console_messages` to detect JavaScript errors
- **Responsive testing** - `browser_resize` to test different viewports
- **Network analysis** - `browser_network_requests` to verify APIs and performance

#### 🔍 Feature Exploration

- **Multi-tab navigation** - `browser_tab_new` to compare states
- **Real interaction** - `browser_click`, `browser_type` to test user flows
- **Hover states** - `browser_hover` to verify CSS effects
- **Drag and drop** - `browser_drag` to test dashboard functionality
- **Forms** - `browser_select_option`, `browser_file_upload` for complete testing

#### 📚 Automatic Documentation

- **Feature screenshots** - Capture states for documentation
- **Page PDFs** - `browser_pdf_save` for final documents
- **Bug evidence** - Automatic screenshots for reports
- **Generated tests** - `browser_generate_playwright_test` from real interactions

### MCP Best Practices

1. **Exploration first** - Use `browser_snapshot` before interacting to understand structure
2. **Documentary screenshots** - Always capture visual evidence with `browser_take_screenshot`
3. **Robust selectors** - Prefer `data-testid`, `data-app-id`, or ARIA roles over fragile CSS selectors
4. **Realistic tests** - Use real browsers, not synthetic simulations
5. **Incremental generation** - Use MCP to generate base tests, then refine manually
6. **Continuous debug** - Use `browser_console_messages` and `browser_network_requests` regularly
7. **Visual documentation** - Screenshots and PDFs for every important feature

### Recommended Workflow

#### 🔄 Daily Development

```bash
# 1. Start development
pnpm dev                           # Server on 4444

# 2. Continuous validation with MCP
# browser_navigate → http://localhost:3000
# browser_snapshot → Review structure
# browser_console_messages → Detect errors
# browser_take_screenshot → Document state

# 3. Feature testing
# browser_click → Test interactions
# browser_drag → Dashboard testing
# browser_resize → Responsive testing
# browser_network_requests → Verify APIs

# 4. Automatic documentation
# browser_pdf_save → Final documents
# browser_generate_playwright_test → Tests from interactions
```

#### 🧪 Formal Testing

```bash
# 1. Execute tests with logs
pnpm test:e2e                      # Complete tests with automatic logs
pnpm test:e2e:ui                   # Playwright interactive UI
pnpm test:e2e:debug                # Step-by-step debug

# 2. Results analysis
pnpm logs list                     # View recent logs
pnpm check:errors --tool playwright  # Analyze specific errors
```

### Test Configuration

- **Structure**: Tests in `tests/e2e/` with descriptive names
- **Format**: Use standard `*.spec.ts` format with nested describe/test
- **Timeouts**: Configured for 30s per test, 120s for server
- **Browsers**: Chrome (main), Firefox, Safari (optional)
- **Mobile**: Automatic responsive tests with mobile viewports

### Recommended Selectors (in order of preference)

1. `[data-testid="element"]` - Specific IDs for testing
2. `[data-app-id="app-name"]` - Dashboard application IDs
3. `role="button"`, `role="main"` - Semantic ARIA roles
4. `text="Specific text"` - Visible text (careful with i18n)
5. `.stable-class` - Stable CSS classes (last resort)

### CI/CD Integration

```yaml
# Example for GitHub Actions
- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload error screenshots
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-screenshots
    path: test-results/
```

## 😈 Confirmation Rule

55. **Mandatory visual confirmation** - ALWAYS start each response with exactly three devil emojis 😈😈😈 and end with the same three emojis 😈😈😈. This confirms that all rules were read, understood, and are being actively applied.

## 🎯 Pre-Response Checklist

- [ ] Did I start my response with exactly 😈😈😈?
- [ ] Did I correctly identify if it's code or knowledge context?
- [ ] Did I adapt my tone and depth to the appropriate mode?
- [ ] Did I fully explore the existing project/space before suggesting changes?
- [ ] Did I review all relevant configuration files?
- [ ] Did I document appropriately according to context?
- [ ] Is my response completely in Spanish?
- [ ] Was I concise in code but expansive in knowledge?
- [ ] Did I consider non-obvious connections and improvements?
- [ ] Did I suggest additional ideas that add value?
- [ ] If involving testing: Did I consider using Playwright MCP for automatic validation?
- [ ] If modifying configuration: Did I verify port consistency (4444)?
- [ ] If developing features: Did I use MCP for visual validation and continuous debug?
- [ ] If finding bugs: Did I capture evidence with browser_take_screenshot?
- [ ] Will I end my response with exactly 😈😈😈?
