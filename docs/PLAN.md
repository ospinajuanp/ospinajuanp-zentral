# Catálogo de Módulos

| Módulo | Key | Tier | Estado | Cuota x defecto |
|---|---|---|---|---|
| TransferCheck | `transfercheck` | Free | Activo | 100 consultas/mes |
| AntecedentesCheck | `antecedentes` | Premium | Próximamente | 500 consultas/mes |
| Facturación Electrónica | `facturacion` | Premium | Próximamente | 500 consultas/mes |
| Cartera | `cartera` | Premium | Próximamente | 500 consultas/mes |

### TransferCheck
- **Descripción:** Verificación y validación de transferencias bancarias en tiempo real.
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

### Module (catálogo maestro)
| Campo | Tipo | Descripción |
|---|---|---|
| `key` | String | Identificador único (slug) |
| `name` | String | Nombre comercial |
| `description` | String | Descripción corta |
| `tier` | enum | `free` / `premium` |
| `status` | enum | `active` / `inactive` / `coming_soon` |
| `defaultQuota` | Number | Cuota por defecto al asignar a un workspace |

### ModuleSubscription (workspace → módulo)
| Campo | Tipo | Descripción |
|---|---|---|
| `workspace` | ref → Workspace | Workspace propietario |
| `moduleKey` | String | Key del módulo |
| `tier` | enum | `free` / `premium` |
| `status` | enum | `active` / `inactive` / `suspended` |
| `monthlyQuota` | Number | Límite mensual del workspace para este módulo |
| `usedQuota` | Number | Consultas consumidas en el período actual |
| `quotaResetAt` | Date | Fecha del próximo reseteo de cuota |
