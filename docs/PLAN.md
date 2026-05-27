# Catálogo de Módulos

| Módulo | Key | Tier | Estado | Cuota x defecto |
|---|---|---|---|---|
| TransferCheck | `transfercheck` | Free | Activo | 100 consultas/mes |
| AntecedentesCheck | `antecedentes` | Premium | Proximamente | 500 consultas/mes |
| Facturacion Electronica | `facturacion` | Premium | Proximamente | 500 consultas/mes |
| Cartera | `cartera` | Premium | Proximamente | 500 consultas/mes |

> **Nota:** AntecedentesCheck, Facturacion Electronica y Cartera tienen paginas placeholder con quota bar. La implementacion funcional de sus APIs y UIs esta pendiente (ver `docs/MEJORAS.md`).

### TransferCheck
- **Descripción:** Verificación y validación de transferencias bancarias mediante OCR (OCR.space) e IA (Gemini), con cruce automático contra correos de Gmail.
- **Disponible en:** Free, Premium, Enterprise.
- **Cuota mensual:** Determinada por el plan del workspace (100, 500, o ilimitado).

### AntecedentesCheck
- **Descripción:** Consulta de antecedentes judiciales, policiales y comerciales.
- **Disponible en:** Premium, Enterprise.
- **Cuota mensual:** 500 consultas/mes en Premium, ilimitado en Enterprise.

### Facturación Electrónica
- **Descripción:** Gestión de facturación electrónica y seguimiento de pagos.
- **Disponible en:** Premium, Enterprise.
- **Cuota mensual:** 500 consultas/mes en Premium, ilimitado en Enterprise.

### Cartera
- **Descripción:** Gestión de cuentas de cobros, seguimiento de pagos y reconciliación.
- **Disponible en:** Premium, Enterprise.
- **Cuota mensual:** 500 consultas/mes en Premium, ilimitado en Enterprise.

## Consultas Mensuales

Cada módulo tiene una cuota de consultas independiente por workspace.

- **Free:** 100 consultas/mes para TransferCheck. Al llegar al límite, el módulo queda en estado de excedido hasta el siguiente período.
- **Premium:** 500 consultas/mes **por módulo**. Ej: 500 para TransferCheck + 500 para AntecedentesCheck = 1000 total.
- **Enterprise:** Consultas ilimitadas en todos los módulos.

### Reseteo
Las consultas se resetean al inicio de cada mes calendario. El consumo acumulado se lleva en el campo `usedQuota` de cada `ModuleSubscription`.

### Control
El helper `checkQuota(workspaceId, moduleKey, increment)` verifica si hay cupo disponible antes de ejecutar una operación. Si se excede, devuelve `allowed: false`.

---

## Modelo de Datos

### Module (catalogo maestro)
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
