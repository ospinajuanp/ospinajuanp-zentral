# AGENTS.md — Zentral

> **Última actualización:** 2026-06-24
> **Estado del proyecto:** ~87% completo

---

## Configuración de Agentes IA para el Proyecto Zentral

### Reglas de Next.js
```markdown
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
```

---

## 📋 Resumen del Proyecto

**Zentral** es una plataforma Micro-SaaS multi-tenant para operaciones empresariales B2B.

### Tech Stack
- Next.js 16.2.6 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS v4
- MongoDB (Mongoose 9.6.2)
- JWT (jose 6.2.3)
- Upstash Redis

### Módulos
1. **TransferCheck** (ACTIVO) - Conciliación bancaria con OCR + Gemini + Gmail
2. **Finanzas Personales** (ACTIVO) - Finanzas personales, ingresos, gastos, deudas, metas, simuladores
3. **Antecedentes** (coming_soon)
4. **Cartera** (coming_soon)
5. **Facturación** (coming_soon)

---

## 🎯 Prioridades Actuales

### 🔥 ALTA PRIORIDAD
1. GEMINI_API_KEY real (IA no funciona)
2. Implementar módulos pendientes (Antecedentes, Cartera, Facturación)
3. `recalculateQuotas` N+1 → `bulkWrite`
4. `processPendingMatches` secuencial → `Promise.allSettled`
5. Rate limiting extendido (solo auth tiene actualmente)

### ⭐ MEDIA PRIORIDAD
1. Pagos reales (Stripe/Wompi)
2. Audit logging completo
3. Breadcrumbs
4. Password policy

### 📋 BAJA PRIORIDAD
1. Tests automatizados
2. PWA support
3. i18n
4. API documentation

---

## 📁 Documentación Clave

| Archivo | Propósito |
|---------|-----------|
| `docs/project-context.espanol.md` | Contexto completo en español |
| `docs/project-context.english.md` | Contexto completo en inglés |
| `docs/MEJORAS.md` | 131 mejoras planificadas |
| `docs/ARCHITECTURE.md` | Arquitectura, Edge proxy, RBAC |
| `docs/CONCURRENCY_En_SAAS.md` | Cuotas atómicas |
| `docs/INTEGRATIONS_PIPELINE.md` | Pipeline IA, Gmail OAuth |
| `docs/Personal-Finance.md` | Módulo de Finanzas Personales (plan completo) |

---

## ⚠️ Reglas Críticas para Agentes

1. **Next.js 16 tiene breaking changes** — verificar `node_modules/next/dist/docs/` antes de escribir código
2. **Mongoose v9** requiere `JSON.parse(JSON.stringify())` después de `.lean()`
3. **GEMINI_API_KEY** usa tier gratuito — `gemini-2.0-flash` funciona consistentemente
4. **Rate limiting** hace bypass si Redis falla (no bloquear usuarios)
5. **Embla v8.6.0** `select` event fires during `init()` — sync manual requerida
6. **Feature toggles** (19) cacheados 10s, `checkFeatureEnabled()` en `src/lib/settings/guard.ts`
7. **Superadmin exento** de: `loginEnabled`, `maintenanceMode`, `moduleAccessEnabled`

---

## 🚀 Scripts Disponibles

```bash
pnpm run dev          # Desarrollo
pnpm run build        # Producción
pnpm run lint         # ESLint
pnpm run type-check   # TypeScript
pnpm run seed         # Poblar BD con datos de prueba
```
