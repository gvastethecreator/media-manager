---
status: accepted
---

# Monolito por contextos con Taxonomy compartida

Image Manager seguirá siendo un monolito, pero con fronteras explícitas por contexto y una organización física progresiva en módulos por contexto con capas internas. `Media Core` es el núcleo protegido; `Worldbuilding Context` puede depender de `Media Core`; `Platform/System Context` sirve a ambos; `Taxonomy` funciona como subdominio compartido y no como cuarto contexto principal; y la migración será incremental tipo strangler para reducir riesgo, hacer visible el acoplamiento y evitar una reorganización big bang sobre un árbol ya frágil.
