# Planes de Precios

Los planes se gestionan dinámicamente desde la BD y se muestran en la landing page.

Cada plan puede heredar módulos de otro plan ("Basado en") más módulos adicionales seleccionados manualmente.

---

## Free — $0/mes

Para empezar a usar Zentral.

| Característica | Incluye |
|---|---|
| Módulos | TransferCheck (heredable) |
| Usuarios | 1 |
| Consultas | 100 / mes por módulo |
| Soporte | Ninguno |
| Onboarding | Ninguno |

## Premium — $12/mes

Para equipos que necesitan más.

| Característica | Incluye |
|---|---|
| Módulos | TransferCheck + AntecedentesCheck + Facturación + Cartera |
| Usuarios | 5 |
| Consultas | 500 / mes por módulo |
| Soporte | Email |
| Onboarding | Autoguiado |
| Extra | Módulos en beta gratis |

## Premium Plus — $24/mes

Máxima potencia sin límites de usuarios.

| Característica | Incluye |
|---|---|
| Módulos | TransferCheck + AntecedentesCheck + Facturación + Cartera |
| Usuarios | Ilimitados |
| Consultas | 500 / mes por módulo |
| Soporte | Canales (Email + Chat) |
| Onboarding | Videos |
| Extra | Módulos en beta, reportes avanzados |

## Enterprise — A medida

Solución personalizada para tu negocio.  
Contacto vía WhatsApp.

| Característica | Incluye |
|---|---|
| Módulos | Todos disponibles |
| Usuarios | Ilimitados |
| Consultas | Ilimitadas por módulo |
| Soporte | Prioritario |
| Onboarding | Dedicado |
| Factura | Personalizada |
| SLA | 48–72 h |

---

## Comparativa rápida

| | Free | Premium | Premium Plus | Enterprise |
|---|---|---|---|---|
| Precio | $0/mes | $12/mes | $24/mes | A medida |
| Usuarios | 1 | 5 | Ilimitados | Ilimitados |
| Módulos | 1 free | Todos (free + premium) | Todos (free + premium) | Todos |
| Consultas | 100/mes | 500/mes por módulo | 500/mes por módulo | Ilimitadas |
| Soporte | Ninguno | Email | Canales | Dedicado |
| Onboarding | Ninguno | Autoguiado | Videos | Dedicado |
| isPayReady | true (auto) | false (pago pendiente) | false (pago pendiente) | false (contacto) |

---

## Modelo de Datos: Plan

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | String | Nombre comercial del plan |
| `price` | String | Texto del precio ("$12", "", "A medida") — opcional |
| `monthlyPrice` | Number or null | Precio numérico mensual (para cálculos de MRR) |
| `description` | String | Descripción corta |
| `includedModules` | Array | Módulos incluidos (ref a Module + quotaOverride) |
| `maxUsers` | Number | Usuarios máximos (0 = ilimitado) |
| `extraFeatures` | String[] | Características extra (una por línea en formulario) |
| `support` | String | `ninguno` / `email` / `prioritario` / `canales` / `dedicado` |
| `onboarding` | String | `ninguno` / `autoguiado` / `videos` / `documentacion` / `dedicado` |
| `cta` | String | Texto del botón (dropdown con opciones + personalizado) |
| `ctaLink` | String | Link del botón. Auto-generado: `/register?plan=ID` o `https://wa.me/NUMBER`. Si es externo (`http`), abre en nueva pestaña sin crear compra |
| `highlighted` | Boolean | Se muestra como "Más popular" |
| `isEnterprise` | Boolean | Plan a medida — borde punteado en landing, sin precio, CTA WhatsApp |
| `whatsappNumber` | String | Número de WhatsApp (solo visible si isEnterprise) |
| `sortOrder` | Number | Orden de aparición (auto-incremental al crear) |
| `isActive` | Boolean | Visible en la landing |
| `basedOn` | Plan? | Herencia de módulos de otro plan (opcional) |

---

## Flujo de Registro con Plan

1. Usuario hace clic en el CTA de un plan en la landing → va a `/register?plan=PLAN_ID`
2. El formulario de registro envía `planId` al backend
3. El backend busca el plan y crea el workspace con:
   - `plans`: [Free, PlanSeleccionado] — array de planes (Free siempre incluido)
   - `isPayReady`: `true` si es plan gratuito (monthlyPrice = 0), `false` si es de pago
   - `ModuleSubscription`s: según los `includedModules` del plan
   - `WorkspacePurchase`: registro de compra para cada plan
4. Si `isPayReady = false`: subs se crean con `status: 'inactive'`
5. El workspace muestra los módulos en el dashboard pero con overlay "Pago pendiente"
6. Superadmin togglea `isPayReady = true` → todas las subs pasan a `active`

---

## Sistema Multi-Plan

Cada workspace soporta múltiples planes simultáneamente (`workspace.plans: Plan[]`).

- **Free incluido siempre**: todo workspace tiene el plan Free como base
- **Planes pagos acumulativos**: las cuotas de módulos se suman entre todas las compras activas
- **WorkspacePurchase**: cada compra genera un registro con `modules[]` (moduleKey, quota, tier), `planName`, `amount`, `status`
- **recalculateQuotas()**: función compartida (`src/lib/purchase/recalculate-quotas.ts`) que agrega cuotas de todas las compras activas + Free y sincroniza `ModuleSubscription`s

### Reglas de Compra
- Plan Free: máximo 1 compra por workspace (ya viene por defecto)
- Planes pagos: compras múltiples permitidas — las cuotas se acumulan
- Sin auto-renovación: mes a mes manual
- CTA externo (`http`): abre `window.open()` en pestaña nueva sin crear compra
- CTA interno: abre pasarela de pago simulada → formulario TC → `handlePurchase()` → crea `WorkspacePurchase` y recalcula cuotas

### Pasarela de Pago (Simulada)
- Free y Enterprise no aparecen en la grilla de compra (solo planes de pago)
- Modal `role="dialog"` con formulario pre-llenado: nombre, apellido, telefono, tarjeta, expiracion, CVV
- Banner "SIMULADO — No se realizaran cobros reales"
- Flujo: formulario → "Procesando pago..." (2s) → exito / rechazo
- Escape key + click overlay cierran el modal

### Historial de Compras
- Columnas: Plan | Estado (Activa/Desactivada/Expirada/Gratuita) | Periodo (DD/MM/YYYY — DD/MM/YYYY) | Monto | Accion
- `expiresAt` = `purchasedAt + 1 mes`
- Free: sin acciones, badge "Gratuita", cuota mensual automatica, vence "∞"
- Desactivar: `PATCH cancelled` → `recalculateQuotas()`. Las cuotas dejan de aportar al workspace
- Reactivar (dentro del periodo): `POST .../reactivate` → crea **nueva** compra con `paymentMethod: 'reactivated'`, mismo periodo que la original. La vieja queda como Desactivada en historial
- Renovar (fuera del periodo): abre pasarela de pago → nueva compra con periodo `hoy → hoy + 1 mes`, la vieja queda en historial

---

Al crear un plan, se puede seleccionar "Basado en" otro plan existente. Esto:

- **Hereda**: módulos, maxUsers, extraFeatures, description, support, onboarding del plan base
- **Módulos heredados**: se muestran en una sección de solo lectura (no aparecen en los checkboxes)
- **Módulos adicionales**: solo los módulos NO heredados son seleccionables
- **Al guardar**: `includedModules = heredados + seleccionados`

Esto permite crear planes como "Premium Plus" que parten de Premium y agregan módulos extra.
