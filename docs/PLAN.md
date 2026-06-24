# Catálogo de Módulos — Zentral

> **Última actualización:** 2026-06-24
> **Estado del proyecto:** 2 activos, 3 en desarrollo

---

## Módulos del Sistema

| Módulo | Key | Tier | Estado | Cuota x defecto |
|---|---|---|---|---|
| TransferCheck | `transfercheck` | Free | ✅ Activo | 100 consultas/mes |
| Finanzas Personales | `personalfinance` | Free | ✅ Activo | 200 consultas/mes |
| AntecedentesCheck | `antecedentes` | Premium | 🔜 Próximamente | 500 consultas/mes |
| Facturacion Electronica | `facturacion` | Premium | 🔜 Próximamente | 500 consultas/mes |
| Cartera | `cartera` | Premium | 🔜 Próximamente | 500 consultas/mes |

> **Nota:** AntecedentesCheck, Facturacion Electronica y Cartera tienen páginas placeholder con quota bar. La implementación funcional de sus APIs y UIs está pendiente (ver `docs/MEJORAS.md` - F-C5).

---

## Finanzas Personales ✅

- **Descripción:** Gestión de finanzas personales, ingresos, gastos, deudas, metas de ahorro, reglas presupuestarias y simuladores financieros.
- **Disponible en:** Free, Premium, Enterprise.
- **Cuota mensual:** 200 consultas/mes.
- **Documentación:** `docs/Personal-Finance.md`

### Características Implementadas
- Panel principal con métricas financieras (ingresos, gastos, saldo neto, deudas)
- Fondo de emergencia con indicador de cobertura
- Registro de ingresos (recurrentes y ocasionales)
- Registro de gastos (obligatorios, ahorro/inversión, discrecionales)
- Sistema de deudas con tipos, saldos y pagos
- Metas de ahorro con plazos y aportes programados
- Reglas presupuestarias (50/30/20, 70/20/10, custom) con análisis visual
- Simuladores stateless (vivienda, vehículo) basados en reglas financieras
- Soporte multi-moneda (COP/USD)
- Categorías editables por el usuario

### Características Pendientes (ver `docs/Personal-Finance.md`)
- [ ] Iteración 1: CRUD básico de ingresos y gastos
- [ ] Iteración 2: Sistema de deudas
- [ ] Iteración 3: Reglas presupuestarias
- [ ] Iteración 4: Fondo de emergencia
- [ ] Iteración 5: Metas de ahorro
- [ ] Iteración 6: Simuladores
- [ ] Iteración 7: Integración final y seed data

---

## AntecedentesCheck 🔜

- **Descripción:** Consulta de antecedentes judiciales, policiales y comerciales.
- **Disponible en:** Premium, Enterprise.
- **Cuota mensual:** 500 consultas/mes en Premium, ilimitado en Enterprise.
- **Estado:** Placeholder UI implementado, lógica pendiente.

---

## Facturación Electrónica 🔜

- **Descripción:** Gestión de facturación electrónica y seguimiento de pagos.
- **Disponible en:** Premium, Enterprise.
- **Cuota mensual:** 500 consultas/mes en Premium, ilimitado en Enterprise.
- **Estado:** Placeholder UI implementado, lógica pendiente.

---

## Cartera 🔜

- **Descripción:** Gestión de cuentas de cobros, seguimiento de pagos y reconciliación.
- **Disponible en:** Premium, Enterprise.
- **Cuota mensual:** 500 consultas/mes en Premium, ilimitado en Enterprise.
- **Estado:** Placeholder UI implementado, lógica pendiente.

---

## Consultas Mensuales

Cada módulo tiene una cuota de consultas independiente por workspace.

- **Free:** 100 consultas/mes para TransferCheck, 200 para Finanzas Personales. Al llegar al límite, el módulo queda en estado de excedido hasta el siguiente período.
- **Premium:** 500 consultas/mes **por módulo**. Ej: 500 para TransferCheck + 500 para Finanzas Personales + 500 para AntecedentesCheck = 1500 total.
- **Enterprise:** Consultas ilimitadas en todos los módulos.

### Reseteo
Las consultas se resetean al inicio de cada mes calendario. El consumo acumulado se lleva en el campo `usedQuota` de cada `ModuleSubscription`.

### Control
El helper `checkQuota(workspaceId, moduleKey, increment)` verifica si hay cupo disponible antes de ejecutar una operación. Si se excede, devuelve `allowed: false`.

---

## Modelo de Datos

### Module (catálogo maestro)
| Campo | Tipo | Descripcion |
|---|---|---|
| `key` | String | Identificador unico (slug) |
| `name` | String | Nombre comercial |
| `description` | String | Descripcion corta |
| `tier` | enum | `free` / `premium` |
| `status` | enum | `active` / `inactive` / `coming_soon` |
| `defaultQuota` | Number | Cuota por defecto al asignar a un workspace |
| `visible` | Boolean | Visible en landing y creacion de planes (default: true) |

### ModuleSubscription (workspace → modulo)
| Campo | Tipo | Descripcion |
|---|---|---|
| `workspace` | ref → Workspace | Workspace propietario |
| `moduleKey` | String | Key del modulo |
| `tier` | enum | `free` / `premium` / `enterprise` |
| `status` | enum | `active` / `inactive` / `suspended` |
| `autoRenew` | Boolean | Renovacion automatica mensual |
| `monthlyQuota` | Number | Limite mensual del workspace para este modulo |
| `usedQuota` | Number | Consultas consumidas en el periodo actual |
| `quotaResetAt` | Date | Fecha del proximo reseteo de cuota |

> **Indice** (compuesto, no unico): `{ workspace, moduleKey, tier }` — permite multiples suscripciones del mismo modulo con diferentes tiers.

---

## 🎯 Prioridades de Implementación

### Alta Prioridad
1. **Implementar módulo Finanzas Personales** — Iteraciones 1-7 (ver `docs/Personal-Finance.md`)
2. **Implementar módulo Antecedentes** — Consulta de antecedentes judiciales/policiales/comerciales
3. **Implementar módulo Cartera** — Gestión de cobros y seguimiento de pagos
4. **Implementar módulo Facturación** — Facturación electrónica y seguimiento

### Pendientes Técnicos
- UI placeholders ya existen en `src/app/(modules)/`
- APIs y lógica de negocio por implementar (Antecedentes, Cartera, Facturación)
- Integración con servicios externos de consulta
