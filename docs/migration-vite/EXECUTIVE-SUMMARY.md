[CREAR_ARCHIVO]

# Resumen Ejecutivo – Migración a Vite + React 19

## Visión general

La migración de **Next.js 15** a **Vite 7 + React 19** posicionará la aplicación *Image Manager* con tiempos de desarrollo y compilación un 60 % más rápidos, builds más livianos y una arquitectura desacoplada apta para web y desktop (Tauri/Electron).

## Plazos clave

| Fase | Fecha fin | Estado |
|------|-----------|--------|
| Auditoría de dependencias | 05-Jul-2025 | ✅ (en curso) |
| Configuración Vite base | 08-Jul-2025 | ⏳ |
| Migración Frontend | 15-Jul-2025 | ⏳ |
| Migración API & Server Actions | 22-Jul-2025 | ⏳ |
| Testing & QA | 26-Jul-2025 | ⏳ |
| Despliegue producción | 30-Jul-2025 | ⏳ |

## Beneficios

1. **DX mejorada**: HMR instantáneo, feedback inmediato.
2. **Reducción de costes**: Images Docker menores → menos GB transferidos.
3. **Portabilidad**: Un solo código para web y escritorio Windows.
4. **Mantenibilidad**: Stack simplificado, sin convenciones Next específicas.

## Riesgos y mitigaciones

| Riesgo | Impacto | Plan |
|--------|---------|------|
| Dependencias acopladas a Next | Medio | Reemplazo identificado en T01 |
| Falta de SSR | Bajo | No se usa; Vite SSR opcional |
| Incompatibilidad Windows | Bajo | Scripts pwsh + empaquetado Tauri/Electron |

## Inversiones necesarias

- 2 FTE frontend, 1 FTE backend, 0.5 QA por 4 semanas.
- 1 runner Windows para CI (GitHub Actions).

## OKRs

| Objetivo | Indicador | Meta |
|----------|-----------|------|
| Mejorar performance build | Tiempo `pnpm build` | ≤ 30 s |
| Reducir tamaño imagen | Docker image | < 250 MB |
| Garantizar calidad | Tests E2E | 100 % pasen |

---

**Sponsor:** CTO

**PM responsable:** @username

**Revisión:** Cada semana en comité técnico.
