# Context Map

## Contexts

- [Shared glossary](./CONTEXT.md) — lenguaje canónico transversal del producto mientras la documentación por contexto se sigue separando.
- **Media Core** — núcleo del producto; administra `Assets`, su identidad, origen, organización y recuperación.
- **Taxonomy** — subdominio compartido; aporta clasificación, facetas y artefactos semánticos reutilizables (`Tag`, `Property`, `Prompt`, `Note`, `Wildcard`).
- **Worldbuilding Context** — capa opcional de significado narrativo; modela `Narrative Entities` que referencian assets sin poseerlos.
- **Platform/System Context** — shell/runtime y capacidades operativas transversales; soporta a los demás contextos sin redefinir el dominio principal.

## Relationships

- **Media Core <- Worldbuilding Context**: Worldbuilding depende de Media Core para referenciar `Assets`; Media Core no depende de Worldbuilding.
- **Media Core <-> Taxonomy**: Media Core consume clasificación y facetas de Taxonomy; Taxonomy describe y estructura objetos del núcleo sin convertirse en su dueño.
- **Worldbuilding Context <-> Taxonomy**: Worldbuilding consume vocabulario y artefactos compartidos (`Prompt`, `Note`, `Wildcard`, `Tag`, `Property`) sin absorber Taxonomy como contexto propio.
- **Platform/System Context -> Media Core / Taxonomy / Worldbuilding Context**: Platform/System provee shell, runtime, observabilidad, settings, cache, query, feedback y demás capacidades transversales.
